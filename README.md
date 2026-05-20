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

Responsabilidad por capas (resumen claro):

1. `Interfaces`
- Recibe requests HTTP y entrega responses.
- Valida formato de entrada, parsea params/body/query.
- No contiene reglas de negocio.

2. `Application`
- Orquesta casos de uso.
- Aplica validaciones de negocio de alto nivel y reglas de flujo.
- Define contratos (interfaces) que la infraestructura debe implementar.

3. `Domain`
- Contiene entidades, value objects y reglas puras del negocio.
- No depende de Express, DB, ni librerias de infraestructura.

4. `Infrastructure`
- Implementa repositorios y adaptadores externos (DB, storage, email, etc.).
- Traduce contratos de `Application` a detalles tecnicos concretos.

Flujo de datos entre capas:

1. Cliente llama endpoint HTTP.
2. `Interfaces` transforma request en input del caso de uso.
3. `Application` ejecuta el caso de uso y aplica reglas.
4. `Application` consulta repositorios definidos por contrato.
5. `Infrastructure` ejecuta persistencia/servicios externos y retorna datos.
6. `Application` arma el resultado final.
7. `Interfaces` responde al cliente en JSON.

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

## Demostracion academica: CRUD de Usuarios y Tecnicos

Esta seccion del proyecto fue implementada para sustentacion academica y evidencia practica de desarrollo frontend moderno sobre backend real.

- Ruta funcional: `/settings/users`.
- CRUD completo integrado con API real:
  - Crear usuario.
  - Listar usuarios.
  - Editar usuario.
  - Desactivar usuario (soft delete).
- SPA real: todas las operaciones actualizan la interfaz sin recargar la pagina completa.
- Estructura del componente con HTML semantico nativo (`main`, `section`, `article`, `form`, `fieldset`, `table`, etc.).
- Estilos en CSS nativo dentro de `style scoped` (sin depender de componentes visuales base para la UI principal).
- Logica y reactividad con JavaScript usando Vue 3 (`script setup` + estado reactivo + manejo de eventos).
- Soporte de modo oscuro y claro, heredando el tema global elegido por el usuario.
- Responsive design para escritorio y mobile.
- Hot reload en desarrollo con Vite (`npm run dev`) para cambios inmediatos durante la demostracion.

Resultado: una demostracion academica clara de integracion frontend-backend, buenas practicas SPA y capacidad de construir UI funcional con HTML/CSS nativo y Vue.js.
