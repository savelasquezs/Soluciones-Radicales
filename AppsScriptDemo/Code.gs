const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1MW6tcc6cbDP5X9YRgW3g3vJZ8JhszCo3_C5iwswSojA',
  PHOTOS_FOLDER_ID: '1PUl9iHOiFDzGj6cy6cj0vXf1VVRXBb0O',
  REPORTS_FOLDER_ID: '19JXmY_kef-SIzKnIF2qg0201NL5mb57H'
});

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Soluciones Radicales | Inspección MIP')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getInitialData() {
  return {
    empresas: readActiveRows_('Empresas'),
    areas: readActiveRows_('Areas'),
    tecnicos: readActiveRows_('Tecnicos'),
    fecha: Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd')
  };
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
    orden: maxOrder + 1
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
    const compliancePct = calculateCompliance_(payload.hallazgos);

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
      empresaId: payload.empresaId
    });

    const photoRecords = [];
    payload.hallazgos.forEach(function (hallazgo, index) {
      const area = getAreaForCompany_(payload.empresaId, hallazgo.areaId);
      const findingId = Utilities.getUuid();

      appendObject_('Hallazgos', {
        id: findingId,
        inspeccionId: inspectionId,
        area: area.nombre,
        categoria: hallazgo.categoria,
        cumplimiento: hallazgo.cumplimiento,
        descripcion: hallazgo.descripcion || '',
        recomendacion: hallazgo.recomendacion || '',
        orden: index + 1,
        areaId: area.id
      });

      const saved = savePhotos_(
        inspectionId,
        findingId,
        area.nombre,
        hallazgo.photos || [],
        now
      );
      Array.prototype.push.apply(photoRecords, saved);
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

    (payload.monitoreo || []).forEach(function (item) {
      if (!String(item.tipo || '').trim() && !String(item.ubicacion || '').trim()) return;
      appendObject_('Monitoreo', {
        id: Utilities.getUuid(),
        inspeccionId: inspectionId,
        tipo: item.tipo || '',
        numeroPunto: item.numeroPunto || '',
        ubicacion: item.ubicacion || '',
        plaga: item.plaga || '',
        cantidad: item.cantidad || '',
        observacion: item.observacion || ''
      });
    });

    const pdfUrl = generatePdf_(payload, inspectionId, photoRecords, compliancePct, now);
    setCellByHeader_('Inspecciones', inspectionRow, 'informePdfUrl', pdfUrl);

    return {
      ok: true,
      inspectionId: inspectionId,
      pdfUrl: pdfUrl,
      cumplimientoPct: compliancePct,
      photosSaved: photoRecords.length,
      hallazgosSaved: payload.hallazgos.length
    };
  } finally {
    lock.releaseLock();
  }
}

function validatePayload_(payload) {
  if (!payload) throw new Error('No se recibieron datos.');

  ['empresaId', 'tecnicoId', 'fecha'].forEach(function (key) {
    if (!String(payload[key] || '').trim()) {
      throw new Error('Falta el campo obligatorio: ' + key);
    }
  });

  const empresa = findById_('Empresas', payload.empresaId);
  if (!empresa) throw new Error('La empresa seleccionada no existe.');

  if (!Array.isArray(payload.hallazgos) || !payload.hallazgos.length) {
    throw new Error('Agrega al menos un hallazgo.');
  }

  let totalPhotos = 0;
  payload.hallazgos.forEach(function (hallazgo, index) {
    ['areaId', 'categoria', 'cumplimiento'].forEach(function (key) {
      if (!String(hallazgo[key] || '').trim()) {
        throw new Error('Hallazgo ' + (index + 1) + ': falta ' + key + '.');
      }
    });
    getAreaForCompany_(payload.empresaId, hallazgo.areaId);
    totalPhotos += (hallazgo.photos || []).length;
  });

  if (totalPhotos > 24) {
    throw new Error('La demo admite máximo 24 fotos por inspección.');
  }
}

function calculateCompliance_(hallazgos) {
  const values = [];
  hallazgos.forEach(function (hallazgo) {
    if (hallazgo.cumplimiento === 'C') values.push(100);
    if (hallazgo.cumplimiento === 'CP') values.push(50);
    if (hallazgo.cumplimiento === 'NC') values.push(0);
  });
  if (!values.length) return 100;
  const total = values.reduce(function (sum, value) { return sum + value; }, 0);
  return Math.round((total / values.length) * 10) / 10;
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

function generatePdf_(payload, inspectionId, photoRecords, compliancePct, now) {
  const reportsFolder = DriveApp.getFolderById(CONFIG.REPORTS_FOLDER_ID);
  const doc = DocumentApp.create('Informe MIP - ' + inspectionId);
  const docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(reportsFolder);

  const body = doc.getBody();
  const empresa = findById_('Empresas', payload.empresaId);
  const tecnico = findById_('Tecnicos', payload.tecnicoId);

  body.appendParagraph('SOLUCIONES RADICALES')
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Informe del servicio de Manejo Integrado de Plagas (MIP)')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  body.appendTable([
    ['Empresa', empresa ? empresa.nombre : payload.empresaId],
    ['NIT', empresa ? (empresa.nit || '') : ''],
    ['Dirección', empresa ? (empresa.direccion || '') : ''],
    ['Fecha', payload.fecha],
    ['Técnico', tecnico ? tecnico.nombre : payload.tecnicoId],
    ['Solicitud de servicio', payload.solicitudServicio || ''],
    ['Cumplimiento general', compliancePct + '%']
  ]);

  body.appendParagraph('Hallazgos y condiciones locativas')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  payload.hallazgos.forEach(function (hallazgo, index) {
    const area = getAreaForCompany_(payload.empresaId, hallazgo.areaId);
    body.appendParagraph((index + 1) + '. ' + area.nombre)
      .setHeading(DocumentApp.ParagraphHeading.HEADING3);
    body.appendTable([
      ['Categoría', hallazgo.categoria],
      ['Cumplimiento', hallazgo.cumplimiento],
      ['Descripción', hallazgo.descripcion || ''],
      ['Recomendación', hallazgo.recomendacion || '']
    ]);

    const findingPhotos = photoRecords.filter(function (photo) {
      return photo.area === area.nombre;
    });

    findingPhotos.forEach(function (photo, photoIndex) {
      body.appendParagraph('Evidencia ' + (photoIndex + 1) + ' - ' + area.nombre);
      const image = body.appendImage(DriveApp.getFileById(photo.driveFileId).getBlob());
      const width = image.getWidth();
      const height = image.getHeight();
      const maxWidth = 440;
      if (width > maxWidth) {
        image.setWidth(maxWidth);
        image.setHeight(Math.round(height * maxWidth / width));
      }
    });
  });

  const productos = payload.productos || [];
  if (productos.some(function (p) { return String(p.producto || '').trim(); })) {
    body.appendParagraph('Productos aplicados')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const table = [['Producto', 'Dosis', 'Lote', 'Vencimiento', 'Método']];
    productos.forEach(function (p) {
      if (!String(p.producto || '').trim()) return;
      table.push([
        p.producto || '',
        p.dosis || '',
        p.lote || '',
        p.vencimiento || '',
        p.metodoAplicacion || ''
      ]);
    });
    body.appendTable(table);
  }

  const monitoreo = payload.monitoreo || [];
  if (monitoreo.some(function (m) {
    return String(m.tipo || '').trim() || String(m.ubicacion || '').trim();
  })) {
    body.appendParagraph('Puestos de monitoreo / trampas')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    const table = [['Tipo', 'N°', 'Ubicación', 'Plaga', 'Cantidad', 'Observación']];
    monitoreo.forEach(function (m) {
      if (!String(m.tipo || '').trim() && !String(m.ubicacion || '').trim()) return;
      table.push([
        m.tipo || '',
        String(m.numeroPunto || ''),
        m.ubicacion || '',
        m.plaga || '',
        String(m.cantidad || ''),
        m.observacion || ''
      ]);
    });
    body.appendTable(table);
  }

  if (payload.observacionesGenerales) {
    body.appendParagraph('Observaciones generales')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);
    body.appendParagraph(payload.observacionesGenerales);
  }

  body.appendParagraph(
    'Generado automáticamente el ' +
    Utilities.formatDate(now, 'America/Bogota', 'dd/MM/yyyy HH:mm')
  );

  doc.saveAndClose();

  const pdfName = 'Informe-MIP-' +
    Utilities.formatDate(now, 'America/Bogota', 'yyyyMMdd-HHmmss') +
    '-' + inspectionId.slice(0, 8) + '.pdf';

  const pdfFile = reportsFolder.createFile(docFile.getAs(MimeType.PDF)).setName(pdfName);
  docFile.setTrashed(true);
  return pdfFile.getUrl();
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

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const row = headers.map(function (header) {
    return Object.prototype.hasOwnProperty.call(obj, header) ? obj[header] : '';
  });

  sheet.appendRow(row);
  return sheet.getLastRow();
}

function setCellByHeader_(sheetName, rowNumber, headerName, value) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
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
