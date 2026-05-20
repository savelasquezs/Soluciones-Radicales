# Frontend - Soluciones Radicales

## Requisitos
- Node.js 20+

## InstalaciÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â³n
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
- `src/modules`: mÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â³dulos por dominio (auth, dashboard, clients, services, settings, layout, technician).

## Estilos globales
- El archivo global oficial es `src/assets/styles/index.css`.
- No usar ni recrear `src/style.css`.
- Mantener Tailwind y variables de tema en `index.css`.

## Assets
- Assets pÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Âºblicos globales: `public/` (solo si deben ser accesibles por URL directa).
- Assets de componentes/mÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â³dulos: `src/assets/`.
- No agregar assets sin uso.
- No conservar logos, favicons o recursos del template de Vite/Vue.

## Regla de componentes
Antes de crear un componente nuevo, usar o extender los componentes base en `src/shared/components/ui`.

## API layer
- Endpoints centralizados en `src/shared/api/endpoints.ts`.
- Cliente HTTP centralizado en `src/shared/api/http.ts` con extracciÃƒÂƒÃ‚Â³n de contrato `{ data: T }`.
- Servicios por mÃƒÂƒÃ‚Â³dulo en `src/modules/*/services` alineados a `/docs/api.md`.
- Tipos compartidos en `src/shared/types` y tipos por mÃƒÂƒÃ‚Â³dulo en `src/modules/*/types`.
- No llamar HTTP directo desde pÃƒÂƒÃ‚Â¡ginas/componentes si existe servicio del mÃƒÂƒÃ‚Â³dulo.
- No crear stores cuando el estado no sea compartido.

## Auth flow
- `login` usa `POST /auth/login` desde `authService` a travÃƒÂ©s de `useAuthStore`.
- Tokens se guardan temporalmente en `localStorage` (`sr_access_token`, `sr_refresh_token`).
- `bootstrapSession` intenta recuperar usuario con `GET /auth/me` al iniciar app.
- Guards protegen rutas por rol y redirigen segÃƒÂºn contexto (`admin` o `technician`).
- Un usuario `admin` + `technician` puede alternar contexto visual con `preferredMode`.
- Las pÃƒÂ¡ginas de auth usan el store; evitar llamar `authService` directo desde pÃƒÂ¡ginas cuando exista acciÃƒÂ³n en store.

## Dashboard
- `DashboardPage` consume datos con `dashboardService` y `servicesService`.
- No se usa store global de dashboard en esta fase; el estado es local de la pÃ¡gina.
- Los filtros de fecha son locales (`from` y `to`) con acciones aplicar y este mes.
- VisualizaciÃ³n inicial con listas y barras simples de Tailwind, sin librerÃ­a externa de grÃ¡ficos.
- Fuentes de datos: `/api/dashboard/summary`, `/api/dashboard/analytics`, `/api/dashboard/alerts`, `/api/services/upcoming`.

## CORS local API
- Frontend local: `http://localhost:5173`.
- Backend API debe definir `CORS_ORIGIN=http://localhost:5173` para desarrollo.
- Si cambias variables de entorno, reinicia `npm run dev` (Front y API si aplica).
