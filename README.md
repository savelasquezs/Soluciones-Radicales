# Soluciones Radicales

Repositorio de la plataforma interna de gestión de fumigaciones B2B.

## Estructura del proyecto

- `API/` - Backend Node.js con Express, TypeScript y Drizzle ORM.
- `Front/` - Frontend Vue 3 con Vite, TypeScript, Pinia y Tailwind CSS.
- `docs/` - Documentación de API y contratos.
- `business-rules.md` - Reglas de negocio del sistema.
- `agents.md` - Reglas de trabajo para agentes y flujo interno.
- `Scripts/` - Scripts SQL de migración.
- `init.sql` - Estado inicial de la base de datos.
- `project-checklist.md` - Tareas y puntos de seguimiento del proyecto.

## Tecnologías principales

- Backend
  - Node.js
  - Express
  - TypeScript
  - Drizzle ORM
  - PostgreSQL
  - JWT

- Frontend
  - Vue 3
  - Vite
  - TypeScript
  - Pinia
  - Tailwind CSS
  - FullCalendar

## Requisitos

- Node.js 20+
- PostgreSQL para el entorno de desarrollo local y pruebas.

## Instalación general

1. Clonar el repositorio.
2. Instalar dependencias en cada subproyecto.

```bash
cd API
npm install
cd ../Front
npm install
```

## Backend - API

### Configuración

1. Crear un archivo `.env` dentro de `API/` con las variables necesarias.
2. Asegurarse de tener la base de datos PostgreSQL en ejecución.
3. Ejecutar los scripts SQL de migración si aplica.

### Comandos útiles

```bash
cd API
npm run dev
npm run build
npm start
npm test
```

## Frontend

### Configuración

1. Crear un archivo `.env` dentro de `Front/` basado en `.env.example` si existe.
2. Ajustar `VITE_API_BASE_URL` a la URL del backend, por ejemplo `http://localhost:3000/api`.

### Comandos útiles

```bash
cd Front
npm run dev
npm run build
npm run preview
npm test
```

## Documentación

- `docs/api.md` - Documentación de endpoints y contratos API.
- `business-rules.md` - Reglas de negocio que deben guiar el desarrollo.
- `agents.md` - Normas internas y acuerdos de desarrollo para agentes.

## Flujo recomendado

1. Revisar `business-rules.md` antes de implementar cualquier regla nueva.
2. Validar los contratos API en `docs/api.md`.
3. Usar `project-checklist.md` para tareas y puntos pendientes.
4. Mantener `Front/` y `API/` separados en sus propios ciclos de desarrollo.

## Notas adicionales

- Las migraciones de base de datos deben incluir un nuevo archivo SQL en `Scripts/` y actualizar `init.sql`.
- El frontend debe respetar la capa de servicios y no acceder a HTTP directamente desde componentes cuando haya un servicio disponible.
- El backend sigue una arquitectura con capas de dominio, aplicación, infraestructura e interfaces.

---

Este README ofrece una guía inicial para arrancar el proyecto y respetar las reglas de negocio del repositorio. Ajustar variables de entorno y configuración específica según el entorno local.
