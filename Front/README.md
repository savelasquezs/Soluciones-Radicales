# Frontend - Soluciones Radicales

## Requisitos
- Node.js 20+

## Instalación
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
- `src/modules`: módulos por dominio (auth, dashboard, clients, services, settings, layout, technician).

## Estilos globales
- El archivo global oficial es `src/assets/styles/index.css`.
- No usar ni recrear `src/style.css`.
- Mantener Tailwind y variables de tema en `index.css`.

## Assets
- Assets públicos globales: `public/` (solo si deben ser accesibles por URL directa).
- Assets de componentes/módulos: `src/assets/`.
- No agregar assets sin uso.
- No conservar logos, favicons o recursos del template de Vite/Vue.

## Regla de componentes
Antes de crear un componente nuevo, usar o extender los componentes base en `src/shared/components/ui`.
