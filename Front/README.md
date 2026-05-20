# Frontend - Soluciones Radicales

## Requisitos
- Node.js 20+

## InstalaciÃ³n
```bash
cd Front
npm install
```

## Desarrollo
```bash
npm run dev
```

## Build
```bash
npm run build
```

## Tests
```bash
npm run test
```

## Variables de entorno
Crear `.env` basado en `.env.example`:

```env
VITE_API_BASE_URL=http://localhost:3000/api
```

## Estructura
- `src/app`: bootstrap, router, providers.
- `src/shared`: api, ui base, composables, helpers, types.
- `src/modules`: mÃ³dulos por dominio (auth, dashboard, clients, services, settings, layout, technician).

## Estilos globales
- El archivo global oficial es `src/assets/styles/index.css`.
- No usar ni recrear `src/style.css`.
- Mantener Tailwind y variables de tema en `index.css`.

## Assets
- Assets pÃºblicos globales: `public/` (solo si deben ser accesibles por URL directa).
- Assets de componentes/mÃ³dulos: `src/assets/`.
- No agregar assets sin uso.
- No conservar logos, favicons o recursos del template de Vite/Vue.

## Regla de componentes
Antes de crear un componente nuevo, usar o extender los componentes base en `src/shared/components/ui`.

## API layer
- Endpoints centralizados en `src/shared/api/endpoints.ts`.
- Cliente HTTP centralizado en `src/shared/api/http.ts` con extracción de contrato `{ data: T }`.
- Servicios por módulo en `src/modules/*/services` alineados a `/docs/api.md`.
- Tipos compartidos en `src/shared/types` y tipos por módulo en `src/modules/*/types`.
- No llamar HTTP directo desde páginas/componentes si existe servicio del módulo.
- No crear stores cuando el estado no sea compartido.
