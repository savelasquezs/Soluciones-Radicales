const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1MW6tcc6cbDP5X9YRgW3g3vJZ8JhszCo3_C5iwswSojA',
  PHOTOS_FOLDER_ID: '1PUl9iHOiFDzGj6cy6cj0vXf1VVRXBb0O',
  REPORTS_FOLDER_ID: '19JXmY_kef-SIzKnIF2qg0201NL5mb57H',
  SIGNATURES_FOLDER_ID: '1bBGPLROCUhPs1y93drm6CW26CD55mhfD',
  LOGO_FILE_ID: '1NFAZtZNwWLxDCQSbAjyVWtXtssmSpU2z'
});

const BRAND = Object.freeze({
  BLUE: '#0877b9',
  BLUE_DARK: '#0b5f91',
  GREEN: '#5b8f18',
  TEXT: '#17324d',
  MUTED: '#65727b'
});

const FORM_META = Object.freeze({
  TITLE: 'PROGRAMA DE CONTROL INTEGRADO DE PLAGA',
  CODE: 'FO-PS-02',
  VERSION: '03',
  SUBTITLE: 'Informe de prestaciones de servicio - condiciones locativas'
});

const DEFAULT_CRITERIA = Object.freeze([
  'Instalación de barreras físicas',
  'Disposición adecuada de residuos sólidos y líquidos',
  'Mantenimiento higiénico',
  'Mantenimiento locativo interno y externo'
]);

const PERIMETER_CRITERIA = Object.freeze([
  'Instalación de barreras físicas alcantarillas',
  'Disposición adecuada de residuos sólidos y líquidos',
  'Mantenimiento higiénico',
  'Mantenimiento zonas verdes'
]);

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Soluciones Radicales | Inspección MIP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function authorizeEmail() {
  const remaining = MailApp.getRemainingDailyQuota();
  return {
    ok: true,
    remainingDailyQuota: remaining
  };
}

function getInitialData() {
  const areas = readActiveRows_('Areas').map(function (area) {
    const copy = Object.assign({}, area);
    copy.criterios = criteriaForAreaName_(area.nombre);
    return copy;
  });

  return {
    empresas: readActiveRows_('Empresas'),
    areas: areas,
    tecnicos: readActiveRows_('Tecnicos'),
    catalogoProductos: readActiveRows_('CatalogoProductos'),
    fecha: Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd'),
    logoDataUrl: getLogoDataUrl_(),
    formMeta: FORM_META
  };
}

function getLogoDataUrl_() {
  try {
    const blob = DriveApp.getFileById(CONFIG.LOGO_FILE_ID).getBlob();
    return 'data:' + blob.getContentType() + ';base64,' +
      Utilities.base64Encode(blob.getBytes());
  } catch (error) {
    return '';
  }
}

function addArea(empresaId, nombre) {
  empresaId = String(empresaId || '').trim();
  nombre = String(nombre || '').trim();

  if (!empresaId) throw new Error('Selecciona una empresa antes de crear el área.');
  if (!nombre) throw new Error('Escribe el nombre del área.');

  const empresa = findById_('Empresas', empresaId);
  if (!empresa || String(empresa.activo).toLowerCase() === 'false') {
    throw new Error('La empresa seleccionada no está disponible.');
  }

  const areas = readActiveRows_('Areas').filter(function (area) {
    return String(area.empresaId) === empresaId;
  });

  const duplicate = areas.some(function (area) {
    return normalize_(area.nombre) === normalize_(nombre);
  });
  if (duplicate) throw new Error('Esta empresa ya tiene un área con ese nombre.');

  const maxOrder = areas.reduce(function (max, area) {
    const n = Number(area.orden || 0);
    return n > max ? n : max;
  }, 0);

  const area = {
    id: Utilities.getUuid(),
    empresaId: empresaId,
    nombre: nombre,
    activo: true,
    orden: maxOrder + 1,
    criterios: criteriaForAreaName_(nombre)
  };

  appendObject_('Areas', area);
  return area;
}

function saveInspection(payload) {
  validatePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const now = new Date();
    const inspectionId = Utilities.getUuid();
    const compliancePct = calculateCompliance_(payload.areaEvaluations);
    const empresa = findById_('Empresas', payload.empresaId);
    const tecnico = findById_('Tecnicos', payload.tecnicoId);

    const inspectionRow = appendObject_('Inspecciones', {
      id: inspectionId,
      fecha: payload.fecha,
      clienteId: payload.empresaId,
      tecnicoId: payload.tecnicoId,
      solicitudServicio: payload.solicitudServicio || '',
      estado: 'FINALIZADO',
      cumplimientoPct: compliancePct,
      observacionesGenerales: payload.observacionesGenerales || '',
      informePdfUrl: '',
      createdAt: now,
      empresaId: payload.empresaId,
      emailEnviadoA: '',
      emailEnviadoAt: '',
      direccionServicio: payload.direccion || '',
      telefonoServicio: payload.telefono || '',
      contactoNombre: payload.contactoNombre || '',
      contactoCargo: payload.contactoCargo || '',
      contactoCelular: payload.contactoCelular || '',
      contactoEmail: payload.contactoEmail || '',
      elaboradoPor: payload.elaboradoPor || ''
    });

    (payload.productos || []).forEach(function (producto) {
      if (!String(producto.producto || '').trim()) return;
      appendObject_('Productos', {
        id: Utilities.getUuid(),
        inspeccionId: inspectionId,
        producto: producto.producto || '',
        dosis: producto.dosis || '',
        lote: producto.lote || '',
        vencimiento: producto.vencimiento || '',
        fabricacion: producto.fabricacion || '',
        metodoAplicacion: producto.metodoAplicacion || '',
        registroSanitario: producto.registroSanitario || ''
      });
    });

    const photoRecords = [];

    payload.areaEvaluations.forEach(function (evaluation, areaIndex) {
      const area = getAreaForCompany_(payload.empresaId, evaluation.areaId);
      let firstFindingId = '';

      if (evaluation.inspected === false) {
        const findingId = Utilities.getUuid();
        firstFindingId = findingId;

        appendObject_('Hallazgos', {
          id: findingId,
          inspeccionId: inspectionId,
          area: area.nombre,
          categoria: 'Área no inspeccionada',
          cumplimiento: 'N/A',
          descripcion: evaluation.skipReason || 'Área no inspeccionada durante esta visita.',
          recomendacion: '',
          orden: (areaIndex * 10) + 1,
          areaId: area.id
        });
      } else {
        const expectedCriteria = criteriaForAreaName_(area.nombre);

        expectedCriteria.forEach(function (criterionLabel, criterionIndex) {
          const incoming = evaluation.criterios[criterionIndex];
          const findingId = Utilities.getUuid();
          if (!firstFindingId) firstFindingId = findingId;

          appendObject_('Hallazgos', {
            id: findingId,
            inspeccionId: inspectionId,
            area: area.nombre,
            categoria: criterionLabel,
            cumplimiento: incoming.cumplimiento,
            descripcion: criterionIndex === 0 ? (evaluation.observacion || '') : '',
            recomendacion: criterionIndex === 0 ? (evaluation.recomendacion || '') : '',
            orden: (areaIndex * 10) + criterionIndex + 1,
            areaId: area.id
          });
        });
      }

      const saved = savePhotos_(
        inspectionId,
        firstFindingId,
        area.nombre,
        evaluation.photos || [],
        now
      );
      Array.prototype.push.apply(photoRecords, saved);
    });

    (payload.monitoreo || []).forEach(function (item) {
      if (!String(item.tipo || '').trim() &&
          !String(item.ubicacion || '').trim() &&
          !String(item.plaga || '').trim()) return;

      appendObject_('Monitoreo', {
        id: Utilities.getUuid(),
        inspeccionId: inspectionId,
        tipo: item.tipo || '',
        numeroPunto: item.numeroPunto || '',
        ubicacion: item.ubicacion || '',
        plaga: item.plaga || '',
        cantidad: item.cantidad || '',
        observacion: item.observacion || '',
        productoQuimico: payload.monitoreoGeneral.productoQuimico || '',
        personaCargo: payload.monitoreoGeneral.personaCargo || '',
        antidoto: payload.monitoreoGeneral.antidoto || ''
      });
    });

    const signatureRecords = [
      saveSignature_(
        inspectionId,
        'TECNICO',
        tecnico ? tecnico.nombre : 'Técnico',
        payload.firmas.tecnico,
        now
      ),
      saveSignature_(
        inspectionId,
        'RESPONSABLE_CLIENTE',
        payload.responsableNombre,
        payload.firmas.cliente,
        now
      )
    ];

    const report = generatePdf_(
      payload,
      inspectionId,
      empresa,
      tecnico,
      photoRecords,
      signatureRecords,
      compliancePct,
      now
    );

    setCellByHeader_('Inspecciones', inspectionRow, 'informePdfUrl', report.file.getUrl());

    const emailTo = String(payload.contactoEmail || (empresa ? empresa.email : '') || '').trim();
    let emailSent = false;
    let emailError = '';

    if (emailTo) {
      try {
        sendReportEmail_(emailTo, empresa, report.file, payload, compliancePct);
        emailSent = true;
        setCellByHeader_('Inspecciones', inspectionRow, 'emailEnviadoA', emailTo);
        setCellByHeader_('Inspecciones', inspectionRow, 'emailEnviadoAt', now);
      } catch (error) {
        emailError = error && error.message ? error.message : String(error);
      }
    } else {
      emailError = 'La empresa no tiene correo configurado.';
    }

    return {
      ok: true,
      inspectionId: inspectionId,
      pdfUrl: report.file.getUrl(),
      cumplimientoPct: compliancePct,
      photosSaved: photoRecords.length,
      areasSaved: payload.areaEvaluations.length,
      signaturesSaved: signatureRecords.length,
      emailSent: emailSent,
      emailTo: emailTo,
      emailError: emailError
    };
  } finally {
    lock.releaseLock();
  }
}

function validatePayload_(payload) {
  if (!payload) throw new Error('No se recibieron datos.');

  ['empresaId', 'tecnicoId', 'fecha', 'responsableNombre'].forEach(function (key) {
    if (!String(payload[key] || '').trim()) {
      throw new Error('Falta el campo obligatorio: ' + key);
    }
  });

  const empresa = findById_('Empresas', payload.empresaId);
  if (!empresa) throw new Error('La empresa seleccionada no existe.');

  if (!Array.isArray(payload.areaEvaluations) || !payload.areaEvaluations.length) {
    throw new Error('La empresa no tiene áreas configuradas para inspeccionar.');
  }

  let totalPhotos = 0;

  payload.areaEvaluations.forEach(function (evaluation, areaIndex) {
    const area = getAreaForCompany_(payload.empresaId, evaluation.areaId);
    const expected = criteriaForAreaName_(area.nombre);

    if (!Array.isArray(evaluation.criterios) ||
        evaluation.criterios.length !== expected.length) {
      throw new Error('Área ' + area.nombre + ': la matriz de evaluación está incompleta.');
    }

    evaluation.criterios.forEach(function (criterion, criterionIndex) {
      const status = String(criterion.cumplimiento || '');
      if (['C', 'CP', 'NC', 'N/A'].indexOf(status) === -1) {
        throw new Error(
          'Área ' + area.nombre + ', criterio ' + (criterionIndex + 1) +
          ': selecciona C, CP, NC o N/A.'
        );
      }
    });

    totalPhotos += (evaluation.photos || []).length;
  });

  if (totalPhotos > 36) {
    throw new Error('La demo admite máximo 36 fotos por inspección.');
  }

  if (!payload.firmas || !payload.firmas.tecnico || !payload.firmas.tecnico.dataBase64) {
    throw new Error('Falta la firma del técnico.');
  }

  if (!payload.firmas.cliente || !payload.firmas.cliente.dataBase64) {
    throw new Error('Falta la firma del responsable del cliente.');
  }

  if (!payload.monitoreoGeneral) {
    payload.monitoreoGeneral = {};
  }
}

function calculateCompliance_(areaEvaluations) {
  const values = [];

  (areaEvaluations || []).forEach(function (evaluation) {
    (evaluation.criterios || []).forEach(function (criterion) {
      if (criterion.cumplimiento === 'C') values.push(100);
      if (criterion.cumplimiento === 'CP') values.push(50);
      if (criterion.cumplimiento === 'NC') values.push(0);
    });
  });

  if (!values.length) return 100;
  const total = values.reduce(function (sum, value) { return sum + value; }, 0);
  return Math.round((total / values.length) * 10) / 10;
}

function areaScore_(criteria) {
  let earned = 0;
  let applicable = 0;

  (criteria || []).forEach(function (criterion) {
    if (criterion.cumplimiento === 'N/A') return;
    applicable += 1.38;
    if (criterion.cumplimiento === 'C') earned += 1.38;
    if (criterion.cumplimiento === 'CP') earned += 0.69;
  });

  if (!applicable) {
    return { earned: 0, max: 0, pct: 100, label: 'N/A' };
  }

  return {
    earned: Math.round(earned * 100) / 100,
    max: Math.round(applicable * 100) / 100,
    pct: Math.round((earned / applicable) * 1000) / 10,
    label: (Math.round(earned * 100) / 100) + ' / ' +
      (Math.round(applicable * 100) / 100)
  };
}

function criteriaForAreaName_(areaName) {
  const normalized = normalize_(areaName);
  const source = normalized.indexOf('perimetral') !== -1 ?
    PERIMETER_CRITERIA : DEFAULT_CRITERIA;

  return source.map(function (item) { return item; });
}

function getAreaForCompany_(empresaId, areaId) {
  const area = findById_('Areas', areaId);
  if (!area || String(area.empresaId) !== String(empresaId) ||
      String(area.activo).toLowerCase() === 'false') {
    throw new Error('El área seleccionada no pertenece a esta empresa.');
  }
  return area;
}

function savePhotos_(inspectionId, findingId, area, photos, now) {
  const folder = DriveApp.getFolderById(CONFIG.PHOTOS_FOLDER_ID);
  const saved = [];

  photos.forEach(function (photo, index) {
    const mimeType = photo.mimeType || 'image/jpeg';
    const safeName = sanitizeFilename_(
      photo.name || ('evidencia-' + (index + 1) + '.jpg')
    );
    const bytes = Utilities.base64Decode(photo.dataBase64);
    const blob = Utilities.newBlob(bytes, mimeType, safeName);
    const file = folder.createFile(blob);

    const record = {
      id: Utilities.getUuid(),
      inspeccionId: inspectionId,
      hallazgoId: findingId,
      area: area,
      driveFileId: file.getId(),
      driveUrl: file.getUrl(),
      nombreArchivo: file.getName(),
      mimeType: mimeType,
      ancho: photo.width || '',
      alto: photo.height || '',
      createdAt: now
    };

    appendObject_('Fotos', record);
    saved.push(record);
  });

  return saved;
}

function saveSignature_(inspectionId, tipo, nombre, signature, now) {
  const folder = DriveApp.getFolderById(CONFIG.SIGNATURES_FOLDER_ID);
  const bytes = Utilities.base64Decode(signature.dataBase64);
  const fileName = sanitizeFilename_(
    'firma-' + tipo.toLowerCase() + '-' + inspectionId.slice(0, 8) + '.png'
  );
  const blob = Utilities.newBlob(bytes, 'image/png', fileName);
  const file = folder.createFile(blob);

  const record = {
    id: Utilities.getUuid(),
    inspeccionId: inspectionId,
    tipo: tipo,
    nombre: nombre,
    driveFileId: file.getId(),
    driveUrl: file.getUrl(),
    createdAt: now
  };

  appendObject_('Firmas', record);
  return record;
}

function generatePdf_(payload, inspectionId, empresa, tecnico, photoRecords, signatureRecords, compliancePct, now) {
  const reportsFolder = DriveApp.getFolderById(CONFIG.REPORTS_FOLDER_ID);
  const doc = DocumentApp.create('Informe MIP - ' + inspectionId);
  const docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(reportsFolder);

  const body = doc.getBody();
  appendLogo_(body);

  const programTitle = body.appendParagraph(FORM_META.TITLE);
  programTitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  programTitle.editAsText()
    .setBold(true)
    .setForegroundColor(BRAND.BLUE_DARK)
    .setFontSize(13);

  const meta = body.appendParagraph(
    'Código: ' + FORM_META.CODE + '   |   Versión: ' + FORM_META.VERSION
  );
  meta.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  meta.editAsText().setForegroundColor(BRAND.MUTED).setFontSize(8);

  const subtitle = body.appendParagraph(FORM_META.SUBTITLE);
  subtitle.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
  subtitle.editAsText().setBold(true).setForegroundColor(BRAND.TEXT).setFontSize(11);

  body.appendTable([
    ['CLIENTE', empresa ? empresa.nombre : payload.empresaId, 'FECHA', payload.fecha],
    ['DIRECCIÓN', payload.direccion || '', 'TELÉFONO', payload.telefono || ''],
    ['CONTACTO', payload.contactoNombre || '', 'CARGO', payload.contactoCargo || ''],
    ['CELULAR', payload.contactoCelular || '', 'E-MAIL', payload.contactoEmail || ''],
    ['TÉCNICO ASIGNADO', tecnico ? tecnico.nombre : payload.tecnicoId, 'ELABORADO POR', payload.elaboradoPor || ''],
    ['SOLICITUD DEL SERVICIO', payload.solicitudServicio || '', 'CUMPLIMIENTO', compliancePct + '%']
  ]);

  appendSectionTitle_(body, 'PRODUCTOS APLICADOS');
  const products = (payload.productos || []).filter(function (item) {
    return String(item.producto || '').trim();
  });

  if (products.length) {
    const productRows = [[
      'Producto', 'Dosis', 'Vencimiento', 'Fabricación', 'Lote', 'Método de aplicación'
    ]];
    products.forEach(function (p) {
      productRows.push([
        p.producto || '',
        p.dosis || '',
        p.vencimiento || '',
        p.fabricacion || '',
        p.lote || '',
        p.metodoAplicacion || ''
      ]);
    });
    body.appendTable(productRows);
  } else {
    body.appendParagraph('Sin productos aplicados registrados.');
  }

  appendSectionTitle_(body, 'CONDICIONES LOCATIVAS');

  payload.areaEvaluations.forEach(function (evaluation) {
    const area = getAreaForCompany_(payload.empresaId, evaluation.areaId);
    const areaTitle = body.appendParagraph(String(area.nombre || '').toUpperCase());
    areaTitle.editAsText().setBold(true).setForegroundColor(BRAND.GREEN);

    const rows = [['Condición', 'C', 'CP', 'NC', 'N/A']];
    evaluation.criterios.forEach(function (criterion) {
      rows.push([
        criterion.label,
        criterion.cumplimiento === 'C' ? 'X' : '',
        criterion.cumplimiento === 'CP' ? 'X' : '',
        criterion.cumplimiento === 'NC' ? 'X' : '',
        criterion.cumplimiento === 'N/A' ? 'X' : ''
      ]);
    });

    const score = areaScore_(evaluation.criterios);
    rows.push(['TOTAL ÁREA', score.label, '', '', score.pct + '%']);
    body.appendTable(rows);

    if (evaluation.observacion) {
      body.appendParagraph('Observación: ' + evaluation.observacion);
    }
    if (evaluation.recomendacion) {
      body.appendParagraph('Recomendación: ' + evaluation.recomendacion);
    }

    const areaPhotos = photoRecords.filter(function (photo) {
      return String(photo.area) === String(area.nombre);
    });

    areaPhotos.forEach(function (photo, index) {
      body.appendParagraph('Evidencia ' + (index + 1) + ' - ' + area.nombre);
      appendSizedImage_(body, DriveApp.getFileById(photo.driveFileId).getBlob(), 430);
    });
  });

  const monitoring = (payload.monitoreo || []).filter(function (item) {
    return String(item.tipo || '').trim() ||
      String(item.ubicacion || '').trim() ||
      String(item.plaga || '').trim();
  });

  if (monitoring.length ||
      payload.monitoreoGeneral.productoQuimico ||
      payload.monitoreoGeneral.personaCargo ||
      payload.monitoreoGeneral.antidoto) {
    appendSectionTitle_(body, 'CONTROL DE TRAMPAS / PUESTOS DE MONITOREO');

    body.appendTable([
      ['Producto químico', payload.monitoreoGeneral.productoQuimico || ''],
      ['Persona a cargo', payload.monitoreoGeneral.personaCargo || ''],
      ['Antídoto', payload.monitoreoGeneral.antidoto || '']
    ]);

    if (monitoring.length) {
      const monitorRows = [['Tipo', 'N°', 'Ubicación', 'Plaga evidenciada', 'Cantidad', 'Observación']];
      monitoring.forEach(function (item) {
        monitorRows.push([
          item.tipo || '',
          String(item.numeroPunto || ''),
          item.ubicacion || '',
          item.plaga || '',
          String(item.cantidad || ''),
          item.observacion || ''
        ]);
      });
      body.appendTable(monitorRows);
    }
  }

  if (payload.observacionesGenerales) {
    appendSectionTitle_(body, 'OBSERVACIONES');
    body.appendParagraph(payload.observacionesGenerales);
  }

  appendSectionTitle_(body, 'FIRMAS');

  const techSignature = signatureRecords.filter(function (item) {
    return item.tipo === 'TECNICO';
  })[0];
  const clientSignature = signatureRecords.filter(function (item) {
    return item.tipo === 'RESPONSABLE_CLIENTE';
  })[0];

  const signatureTable = body.appendTable([
    ['Firma Técnico', 'Firma Responsable'],
    ['', ''],
    ['', '']
  ]);

  if (techSignature) {
    const image = signatureTable.getCell(1, 0)
      .appendImage(DriveApp.getFileById(techSignature.driveFileId).getBlob());
    resizeInlineImage_(image, 190);
  }

  if (clientSignature) {
    const image = signatureTable.getCell(1, 1)
      .appendImage(DriveApp.getFileById(clientSignature.driveFileId).getBlob());
    resizeInlineImage_(image, 190);
  }

  signatureTable.getCell(2, 0).setText(tecnico ? tecnico.nombre : 'Técnico');
  signatureTable.getCell(2, 1).setText(payload.responsableNombre);

  const generated = body.appendParagraph(
    'Generado automáticamente el ' +
    Utilities.formatDate(now, 'America/Bogota', 'dd/MM/yyyy HH:mm')
  );
  generated.editAsText().setForegroundColor(BRAND.MUTED).setFontSize(8);

  doc.saveAndClose();

  const pdfName = 'Informe-MIP-' +
    Utilities.formatDate(now, 'America/Bogota', 'yyyyMMdd-HHmmss') +
    '-' + inspectionId.slice(0, 8) + '.pdf';

  const pdfFile = reportsFolder.createFile(docFile.getAs(MimeType.PDF)).setName(pdfName);
  docFile.setTrashed(true);

  return { file: pdfFile };
}

function appendLogo_(body) {
  try {
    const paragraph = body.appendParagraph('');
    paragraph.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    const image = paragraph.appendInlineImage(
      DriveApp.getFileById(CONFIG.LOGO_FILE_ID).getBlob()
    );
    resizeInlineImage_(image, 245);
  } catch (error) {
    const fallback = body.appendParagraph('SOLUCIONES RADICALES');
    fallback.setAlignment(DocumentApp.HorizontalAlignment.CENTER);
    fallback.editAsText()
      .setBold(true)
      .setForegroundColor(BRAND.BLUE_DARK)
      .setFontSize(18);
  }
}

function appendSectionTitle_(body, text) {
  const p = body.appendParagraph(text);
  p.editAsText()
    .setBold(true)
    .setForegroundColor(BRAND.BLUE_DARK)
    .setFontSize(11);
  return p;
}

function appendSizedImage_(body, blob, maxWidth) {
  const image = body.appendImage(blob);
  resizeInlineImage_(image, maxWidth);
  return image;
}

function resizeInlineImage_(image, maxWidth) {
  const width = image.getWidth();
  const height = image.getHeight();
  if (width > maxWidth) {
    image.setWidth(maxWidth);
    image.setHeight(Math.round(height * maxWidth / width));
  }
}

function sendReportEmail_(to, empresa, pdfFile, payload, compliancePct) {
  if (!to) throw new Error('La empresa no tiene correo configurado.');

  const companyName = empresa ? empresa.nombre : 'Cliente';
  const subject = 'Informe de prestación de servicio MIP - ' +
    companyName + ' - ' + payload.fecha;

  const bodyText =
    'Buen día.\n\n' +
    'Adjuntamos el informe de prestación de servicio del Programa de Control Integrado de Plaga realizado el ' +
    payload.fecha + '.\n' +
    'Cumplimiento general registrado: ' + compliancePct + '%.\n\n' +
    'Soluciones Radicales';

  const htmlBody =
    '<p>Buen día.</p>' +
    '<p>Adjuntamos el informe de prestación de servicio del <b>Programa de Control Integrado de Plaga</b> realizado el ' +
    escapeHtmlServer_(payload.fecha) + '.</p>' +
    '<p>Cumplimiento general registrado: <b>' + compliancePct + '%</b>.</p>' +
    '<p><b>Soluciones Radicales</b><br>Control integrado de plaga</p>';

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: bodyText,
    htmlBody: htmlBody,
    attachments: [pdfFile.getBlob().setName(pdfFile.getName())],
    name: 'Soluciones Radicales'
  });
}

function escapeHtmlServer_(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function readActiveRows_(sheetName) {
  return readTable_(sheetName).filter(function (row) {
    return row.activo !== false && String(row.activo).toLowerCase() !== 'false';
  });
}

function findById_(sheetName, id) {
  const rows = readTable_(sheetName);
  return rows.find(function (row) {
    return String(row.id) === String(id);
  }) || null;
}

function readTable_(sheetName) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);

  return values
    .filter(function (row) {
      return row.some(function (cell) { return cell !== ''; });
    })
    .map(function (row) {
      const item = {};
      headers.forEach(function (header, index) {
        item[header] = row[index];
      });
      return item;
    });
}

function appendObject_(sheetName, obj) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet) throw new Error('No existe la hoja: ' + sheetName);

  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);

  const row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(obj, header) ? obj[header] : '';
  });

  sheet.appendRow(row);
  return sheet.getLastRow();
}

function setCellByHeader_(sheetName, rowNumber, headerName, value) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map(String);

  const column = headers.indexOf(headerName) + 1;
  if (!column) throw new Error('No existe la columna: ' + headerName);

  sheet.getRange(rowNumber, column).setValue(value);
}

function normalize_(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function sanitizeFilename_(name) {
  return String(name)
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ._ -]/g, '_')
    .slice(0, 120);
}
