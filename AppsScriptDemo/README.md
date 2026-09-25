# Demo MIP en Google Apps Script

Prototipo funcional para demostrar al cliente el flujo:

**Empresa → técnico → inspección por áreas → evidencias → productos/monitoreo → Sheets/Drive → PDF automático**

## Recursos

- Spreadsheet: `1MW6tcc6cbDP5X9YRgW3g3vJZ8JhszCo3_C5iwswSojA`
- Carpeta de fotos: `1PUl9iHOiFDzGj6cy6cj0vXf1VVRXBb0O`
- Carpeta de informes: `19JXmY_kef-SIzKnIF2qg0201NL5mb57H`
- Apps Script ID: `19KdMkSm-JReAQY16EPjiBWrpbkuWkFrbn7TZaEa66N9BZTSkmlWLKukx`

## Versión 2

La demo maneja empresas y áreas como entidades separadas.

- Cada empresa tiene su propio catálogo de áreas.
- Se pueden crear nuevas áreas desde la misma Web App.
- Una inspección puede tener múltiples hallazgos.
- Cada hallazgo puede pertenecer a un área distinta y tener fotografías propias.
- Se calcula automáticamente el porcentaje general de cumplimiento.
- Se pueden registrar productos aplicados.
- Se pueden registrar trampas y puestos de monitoreo.
- Se generan firmas digitales del técnico y del responsable del cliente, almacenadas en Drive y visibles en el PDF.
- El PDF se envía automáticamente al correo configurado de la empresa.
- La interfaz y el PDF utilizan el logo recuperado del informe original y los colores corporativos azul/verde.
- Se genera un PDF final con toda la información.

Hojas principales:

`Empresas`, `Areas`, `Inspecciones`, `Tecnicos`, `Hallazgos`, `Fotos`, `Firmas`, `Productos`, `Monitoreo` y `Configuracion`.

La hoja `Clientes` se conserva para compatibilidad con la versión 1 de la demo.

## Sincronizar cambios

Desde la raíz del repositorio:

```bash
git switch feature/apps-script-demo
git pull
cd AppsScriptDemo
npm install
npx clasp login
npx clasp push
```

## Crear una versión desplegable

```bash
npx clasp version "Demo MIP v2"
```

Usa el número devuelto:

```bash
npx clasp deploy -V NUMERO -d "Demo MIP v2"
npx clasp deployments
```

## Rama

`feature/apps-script-demo`

La demo está aislada del API/Frontend histórico del repositorio.


## Correos de prueba por empresa

- Comercializadora Palacio G S.A.S → `santyvan974@gmail.com`
- Bello Oro Pan S.A.S → `santiago.velasquez022@pascualbravo.edu.co`

El correo se toma del registro de la empresa seleccionada; no está fijo en el código.

## Identidad visual

El logo usado por la demo fue recuperado del informe original suministrado y almacenado en Drive.
La paleta aplicada conserva los tonos existentes en el material fuente:

- Azul principal: `#0877b9`
- Azul oscuro: `#0b5f91`
- Verde: `#5b8f18`
