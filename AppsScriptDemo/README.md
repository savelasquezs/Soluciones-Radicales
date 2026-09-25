# Demo MIP en Google Apps Script

Prototipo aislado para demostrar al cliente el flujo:

**Técnico → inspección → evidencia fotográfica → Google Sheets/Drive → PDF automático**

## Recursos ya creados

- Spreadsheet: `1MW6tcc6cbDP5X9YRgW3g3vJZ8JhszCo3_C5iwswSojA`
- Carpeta de fotos: `1PUl9iHOiFDzGj6cy6cj0vXf1VVRXBb0O`
- Carpeta de informes: `19JXmY_kef-SIzKnIF2qg0201NL5mb57H`

El spreadsheet incluye hojas para:
`Inspecciones`, `Clientes`, `Tecnicos`, `Hallazgos`, `Fotos`, `Productos`, `Monitoreo` y `Configuracion`.

## Único paso manual inicial

Crear un proyecto vacío en https://script.google.com/ y copiar su **Script ID** desde:

**Configuración del proyecto → IDs → ID de secuencia de comandos**

Después, en este directorio:

```bash
npm install -g @google/clasp
clasp login
cp .clasp.json.example .clasp.json
```

Reemplazar `PEGA_AQUI_EL_SCRIPT_ID` por el Script ID real y ejecutar:

```bash
clasp push
clasp open
```

## Despliegue web

En Apps Script:

1. **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo**
4. Acceso: el nivel acordado para la demo
5. Autorizar permisos de Sheets, Drive y Docs
6. Abrir la URL generada desde el celular

## Qué hace la demo

- Carga clientes y técnicos desde Google Sheets.
- Captura un hallazgo MIP.
- Permite tomar/subir hasta 8 fotos.
- Comprime las fotos en el navegador a un máximo de 1600 px y JPEG 72%.
- Guarda evidencias en Drive.
- Registra datos y URLs en Sheets.
- Genera automáticamente un PDF con el resumen y las fotografías.

## Rama

Trabajo preparado en:

`feature/apps-script-demo`

No afecta el sistema actual de API/Frontend del repositorio.
