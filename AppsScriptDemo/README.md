# Demo MIP en Google Apps Script

Prototipo aislado para demostrar al cliente el flujo:

**Técnico → inspección → evidencia fotográfica → Google Sheets/Drive → PDF automático**

## Recursos ya creados

- Spreadsheet: `1MW6tcc6cbDP5X9YRgW3g3vJZ8JhszCo3_C5iwswSojA`
- Carpeta de fotos: `1PUl9iHOiFDzGj6cy6cj0vXf1VVRXBb0O`
- Carpeta de informes: `19JXmY_kef-SIzKnIF2qg0201NL5mb57H`
- Apps Script ID: `19KdMkSm-JReAQY16EPjiBWrpbkuWkFrbn7TZaEa66N9BZTSkmlWLKukx`

El spreadsheet incluye hojas para:
`Inspecciones`, `Clientes`, `Tecnicos`, `Hallazgos`, `Fotos`, `Productos`, `Monitoreo` y `Configuracion`.

## Conexión con Apps Script

El archivo `.clasp.json` ya está creado y apunta al proyecto correcto.

Desde la raíz del repositorio:

```bash
git checkout feature/apps-script-demo
cd AppsScriptDemo
npm install
npx clasp login
npx clasp push
npx clasp open
```

El único paso interactivo es `npx clasp login`: Google abrirá el navegador para autorizar la cuenta.

## Despliegue web

En Apps Script:

1. **Implementar → Nueva implementación**
2. Tipo: **Aplicación web**
3. Ejecutar como: **Yo**
4. Elegir el acceso apropiado para la demo
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
