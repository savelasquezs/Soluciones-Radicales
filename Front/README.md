# Frontend - Soluciones Radicales

## Requisitos
- Node.js 20+

## InstalaciÃƒÂ³n
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
- `src/modules`: mÃƒÂ³dulos por dominio (auth, dashboard, clients, services, settings, layout, technician).

## Estilos globales
- El archivo global oficial es `src/assets/styles/index.css`.
- No usar ni recrear `src/style.css`.
- Mantener Tailwind y variables de tema en `index.css`.

## Assets
- Assets pÃƒÂºblicos globales: `public/` (solo si deben ser accesibles por URL directa).
- Assets de componentes/mÃƒÂ³dulos: `src/assets/`.
- No agregar assets sin uso.
- No conservar logos, favicons o recursos del template de Vite/Vue.

## Regla de componentes
Antes de crear un componente nuevo, usar o extender los componentes base en `src/shared/components/ui`.

## API layer
- Endpoints centralizados en `src/shared/api/endpoints.ts`.
- Cliente HTTP centralizado en `src/shared/api/http.ts` con extracciÃ³n de contrato `{ data: T }`.
- Servicios por mÃ³dulo en `src/modules/*/services` alineados a `/docs/api.md`.
- Tipos compartidos en `src/shared/types` y tipos por mÃ³dulo en `src/modules/*/types`.
- No llamar HTTP directo desde pÃ¡ginas/componentes si existe servicio del mÃ³dulo.
- No crear stores cuando el estado no sea compartido.

## Auth flow
- `login` usa `POST /auth/login` desde `authService` a través de `useAuthStore`.
- Tokens se guardan temporalmente en `localStorage` (`sr_access_token`, `sr_refresh_token`).
- `bootstrapSession` intenta recuperar usuario con `GET /auth/me` al iniciar app.
- Guards protegen rutas por rol y redirigen según contexto (`admin` o `technician`).
- Un usuario `admin` + `technician` puede alternar contexto visual con `preferredMode`.
- Las páginas de auth usan el store; evitar llamar `authService` directo desde páginas cuando exista acción en store.
