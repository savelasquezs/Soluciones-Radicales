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

## Arquitectura limpia y flujo de datos

Soluciones Radicales usa Clean Architecture para aislar la lógica de negocio de detalles técnicos. Las capas principales son:

- Domain: entidades y reglas puras.
- Application: casos de uso (orquestación y validaciones de alto nivel).
- Interfaces: adaptadores HTTP (controllers, routes, presenters).
- Infrastructure: persistencia y adaptadores externos (DB, Firebase, email, etc.).

Flujo de una petición (resumen):

1. Cliente → Router / Controller (Interfaces).
2. Controller → DTO → Caso de uso (Application).
3. Caso de uso aplica reglas (Domain) y pide operaciones a repositorios (contratos definidos por Application).
4. Repositorio (Infrastructure) ejecuta SQL/ORM y devuelve entidades.
5. Caso de uso transforma resultado → Controller → Response al cliente.

Flujos asíncronos (cron/jobs): scheduler → caso de uso → repositorios → notificaciones / actualizaciones de ciclos.

Diagrama ASCII (vertical):

  +----------------------+
  |  Cliente / UI / API  |  <-- HTTP, Web, Mobile, Cron
  +----------+-----------+
             |
             v
  +----------+-----------+
  |     Interfaces       |  <-- Controllers, Routes, Presenters
  +----------+-----------+
             |
             v
  +----------+-----------+
  |    Application       |  <-- Use Cases / Services / DTOs
  +----------+-----------+
             |
             v
  +----------+-----------+
  |      Domain          |  <-- Entities, Value Objects, Business Rules
  +----------+-----------+
             |
             v
  +----------+-----------+
  |   Infrastructure     |  <-- Repositories, DB, Firebase, Email
  +----------------------+

Dónde buscar código (guía rápida):

- `API/` — buscar las carpetas `domain/`, `application/`, `infrastructure/`, `interfaces/` dentro del backend.
- Tests y casos de uso: en `API/` bajo `application/` y `domain/`.
- Migraciones y scripts de BD: `Scripts/` y `init.sql` (obligatorio mantener actualizado cuando cambien tablas).

Buenas prácticas relacionadas con esta arquitectura:

- Controllers delgados: sólo convertir request ↔ DTO y delegar a casos de uso.
- Application define interfaces; Infrastructure implementa esas interfaces.
- Mantener la lógica de negocio en `domain` y casos de uso; evitar SQL o llamadas externas en controllers.

---

Este README ofrece una guía inicial para arrancar el proyecto y respetar las reglas de negocio del repositorio. Ajustar variables de entorno y configuración específica según el entorno local.
