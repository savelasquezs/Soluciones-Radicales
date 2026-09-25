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
    clientes: readActiveRows_('Clientes'),
    tecnicos: readActiveRows_('Tecnicos'),
    fecha: Utilities.formatDate(new Date(), 'America/Bogota', 'yyyy-MM-dd')
  };
}

function saveInspection(payload) {
  validatePayload_(payload);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const now = new Date();
    const inspectionId = Utilities.getUuid();
    const findingId = Utilities.getUuid();

    const inspectionRow = appendObject_('Inspecciones', {
      id: inspectionId,
      fecha: payload.fecha,
      clienteId: payload.clienteId,
      tecnicoId: payload.tecnicoId,
      solicitudServicio: payload.solicitudServicio || '',
      estado: 'FINALIZADO',
      cumplimientoPct: '',
      observacionesGenerales: payload.observacionesGenerales || '',
      informePdfUrl: '',
      createdAt: now
    });

    appendObject_('Hallazgos', {
      id: findingId,
      inspeccionId: inspectionId,
      area: payload.area,
      categoria: payload.categoria,
      cumplimiento: payload.cumplimiento,
      descripcion: payload.descripcion || '',
      recomendacion: payload.recomendacion || '',
      orden: 1
    });

    const photoRecords = savePhotos_(inspectionId, findingId, payload.area, payload.photos || [], now);
    const pdfUrl = generatePdf_(payload, inspectionId, photoRecords, now);
    setCellByHeader_('Inspecciones', inspectionRow, 'informePdfUrl', pdfUrl);

    return {
      ok: true,
      inspectionId,
      pdfUrl,
      photosSaved: photoRecords.length
    };
  } finally {
    lock.releaseLock();
  }
}

function validatePayload_(payload) {
  if (!payload) throw new Error('No se recibieron datos.');
  ['clienteId', 'tecnicoId', 'fecha', 'area', 'categoria', 'cumplimiento'].forEach(function (key) {
    if (!String(payload[key] || '').trim()) {
      throw new Error('Falta el campo obligatorio: ' + key);
    }
  });
  if ((payload.photos || []).length > 8) {
    throw new Error('La demo admite máximo 8 fotos por inspección.');
  }
}

function savePhotos_(inspectionId, findingId, area, photos, now) {
  const folder = DriveApp.getFolderById(CONFIG.PHOTOS_FOLDER_ID);
  const saved = [];

  photos.forEach(function (photo, index) {
    const mimeType = photo.mimeType || 'image/jpeg';
    const extension = mimeType === 'image/png' ? '.png' : '.jpg';
    const safeName = sanitizeFilename_(photo.name || ('foto-' + (index + 1) + extension));
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

function generatePdf_(payload, inspectionId, photoRecords, now) {
  const reportsFolder = DriveApp.getFolderById(CONFIG.REPORTS_FOLDER_ID);
  const doc = DocumentApp.create('Informe MIP - ' + inspectionId);
  const docFile = DriveApp.getFileById(doc.getId());
  docFile.moveTo(reportsFolder);

  const body = doc.getBody();
  body.appendParagraph('SOLUCIONES RADICALES')
    .setHeading(DocumentApp.ParagraphHeading.HEADING1);
  body.appendParagraph('Informe de inspección MIP')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);

  const cliente = findById_('Clientes', payload.clienteId);
  const tecnico = findById_('Tecnicos', payload.tecnicoId);

  body.appendParagraph('Fecha: ' + payload.fecha);
  body.appendParagraph('Cliente: ' + (cliente ? cliente.nombre : payload.clienteId));
  body.appendParagraph('Técnico: ' + (tecnico ? tecnico.nombre : payload.tecnicoId));
  if (payload.solicitudServicio) body.appendParagraph('Solicitud de servicio: ' + payload.solicitudServicio);

  body.appendParagraph('Hallazgo')
    .setHeading(DocumentApp.ParagraphHeading.HEADING2);
  body.appendParagraph('Área: ' + payload.area);
  body.appendParagraph('Categoría: ' + payload.categoria);
  body.appendParagraph('Cumplimiento: ' + payload.cumplimiento);
  if (payload.descripcion) body.appendParagraph('Descripción: ' + payload.descripcion);
  if (payload.recomendacion) body.appendParagraph('Recomendación: ' + payload.recomendacion);
  if (payload.observacionesGenerales) {
    body.appendParagraph('Observaciones generales: ' + payload.observacionesGenerales);
  }

  if (photoRecords.length) {
    body.appendParagraph('Evidencias fotográficas')
      .setHeading(DocumentApp.ParagraphHeading.HEADING2);

    photoRecords.forEach(function (photo, index) {
      const blob = DriveApp.getFileById(photo.driveFileId).getBlob();
      body.appendParagraph('Evidencia ' + (index + 1) + ' - ' + photo.area);
      const image = body.appendImage(blob);
      const width = image.getWidth();
      const height = image.getHeight();
      const maxWidth = 460;
      if (width > maxWidth) {
        image.setWidth(maxWidth);
        image.setHeight(Math.round(height * maxWidth / width));
      }
    });
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
  return rows.find(function (row) { return String(row.id) === String(id); }) || null;
}

function readTable_(sheetName) {
  const sheet = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID).getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values.shift().map(String);

  return values
    .filter(function (row) { return row.some(function (cell) { return cell !== ''; }); })
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

function sanitizeFilename_(name) {
  return String(name)
    .replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ._ -]/g, '_')
    .slice(0, 120);
}
