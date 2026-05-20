# Project Checklist ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Soluciones Radicales

Este documento sirve para hacer seguimiento funcional del sistema interno de fumigaciones B2B.

Fuentes obligatorias:

- `/agents.md`
- `/business-rules.md`
- `/init.sql`

Si un cambio modifica base de datos:

1. Crear script SQL en `/Scripts`
2. Actualizar `/init.sql`
3. Actualizar schema de Drizzle
4. Actualizar reglas de negocio si aplica

---

## Estado actual confirmado

### Base del proyecto

- [x] Backend en carpeta `API`.
- [x] `agents.md` en raÃƒÆ’Ã‚Â­z.
- [x] `business-rules.md` en raÃƒÆ’Ã‚Â­z.
- [x] `init.sql` en raÃƒÆ’Ã‚Â­z.
- [x] Scripts SQL definidos para `/Scripts`.
- [x] Backend con Clean Architecture.
- [x] Drizzle usado en infraestructura.
- [x] Vitest configurado.
- [x] Controllers y routes iniciales.
- [x] Middleware central de errores.

---

## Backend ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Casos de uso implementados

### Clientes

- [x] `createInitialClient`
- [x] `getClientById`
- [x] `listClients`
- [x] `searchClientsByName`
- [x] `addBusinessToClient`
- [x] `addBranchToBusiness`
- [x] `getClientDetail`
- [x] `updateClient`
- [x] `updateBusiness`
- [x] `updateBranch`
- [x] `updateBranchConfiguration`
- [x] `getBranchHistory`

Notas:

- [x] `getClientDetail` retorna cliente, negocios, sucursales y `service_cycles` sin cargar historial completo.
- [x] `getBranchHistory` retorna historial bÃƒÆ’Ã‚Â¡sico de `services` por sucursal con filtros opcionales.
- [x] Se mantiene separaciÃƒÆ’Ã‚Â³n entre detalle de cliente e historial para evitar respuestas pesadas.
- [x] Se mantiene separaciÃƒÆ’Ã‚Â³n entre ediciÃƒÆ’Ã‚Â³n de datos bÃƒÆ’Ã‚Â¡sicos de sucursal y configuraciÃƒÆ’Ã‚Â³n para no mezclar validaciones.
- [ ] Si luego se requiere historial enriquecido con tÃƒÆ’Ã‚Â©cnicos, evidencias y mÃƒÆ’Ã‚Â©todo de pago en una sola respuesta, crear un repositorio de lectura especÃƒÆ’Ã‚Â­fico para esa vista. No armar esa lÃƒÆ’Ã‚Â³gica en controllers.

### Servicios base

- [x] `createService`
- [x] `assignTechniciansToService`
- [x] `updateServiceStatus`
- [x] `getServiceById`
- [x] `getServicesByDay`
- [x] `getServicesByMonth`
- [x] `getTechnicianSchedule`
- [x] `getUpcomingServices`
- [x] `rescheduleService`
- [x] `cancelService`

### Servicios tÃƒÆ’Ã‚Â©cnicos operativos

- [x] `startService`
- [x] `completeService`
- [x] `addServiceNotes`
- [x] `updateServicePayment`
- [x] `addPaymentProof`
- [x] `addServiceEvidence`
- [x] `listServiceEvidences`
- [x] `generateReinforcementService`

Notas:

- [x] `completeService` actualiza el ciclo y prepara fechas de refuerzo usando la lÃƒÆ’Ã‚Â³gica existente de completado.
- [x] El refuerzo se crea como servicio real en `services`.
- [x] `generateReinforcementService` evita duplicados por sucursal + fecha del refuerzo.
- [x] `completeService` solo actualiza `service_cycles`; no crea refuerzos automÃƒÆ’Ã‚Â¡ticamente.
- [ ] Evaluar si `generateReinforcementService` debe abrirse a tÃƒÆ’Ã‚Â©cnicos asignados; por ahora queda restringido a `admin`.

### Usuarios

- [x] `createUser`
- [x] `getUserById`
- [x] `listTechnicians`
- [x] `updateUser`

### ConfiguraciÃƒÆ’Ã‚Â³n

- [x] `getSystemSettings`
- [x] `updateSystemSettings`
- [x] `createPaymentMethod`
- [x] `listActivePaymentMethods`
- [x] `updatePaymentMethod`
- [x] `disablePaymentMethod`

### AutenticaciÃƒÆ’Ã‚Â³n

- [x] `login`
- [x] `refreshToken`
- [x] `logout`
- [x] `getCurrentUser`
- [x] `changePassword`
- [x] `requestPasswordReset`
- [x] `resetPassword`
- [x] Hash de refresh tokens.
- [x] Hash de reset tokens.
- [x] Middleware de autenticaciÃƒÆ’Ã‚Â³n.
- [x] Middleware de rol.
- [x] Middleware de tÃƒÆ’Ã‚Â©cnico.
- [x] Rutas protegidas.
- [x] Contrato HTTP de `POST /api/auth/forgot-password` alineado al estÃƒÆ’Ã‚Â¡ndar `{ "data": ... }` con `data.success`.

---

## PrÃƒÆ’Ã‚Â³ximo paso recomendado

### DocumentaciÃƒÆ’Ã‚Â³n mÃƒÆ’Ã‚Â­nima de API para frontend

El backend ya cubre autenticaciÃƒÆ’Ã‚Â³n, clientes, servicios, operaciÃƒÆ’Ã‚Â³n tÃƒÆ’Ã‚Â©cnica, refuerzos e historial bÃƒÆ’Ã‚Â¡sico.

Antes de pasar a dashboard o frontend, conviene documentar los endpoints tÃƒÆ’Ã‚Â©cnicos y administrativos ya existentes para que el frontend no tenga que inferir contratos desde controllers.

Pendientes:

- [x] Crear documentaciÃƒÆ’Ã‚Â³n mÃƒÆ’Ã‚Â­nima de endpoints administrativos.
- [x] Crear documentaciÃƒÆ’Ã‚Â³n mÃƒÆ’Ã‚Â­nima de endpoints tÃƒÆ’Ã‚Â©cnicos.
- [x] Documentar payloads principales.
- [x] Documentar respuestas `{ data }` y errores `{ message }`.
- [x] Documentar permisos por endpoint.
- [x] Mantener la documentaciÃƒÆ’Ã‚Â³n simple, preferiblemente en Markdown.

Notas:

- [x] DocumentaciÃƒÆ’Ã‚Â³n creada en `/docs/api.md`.

---

## Pendientes directos del mÃƒÆ’Ã‚Â³dulo tÃƒÆ’Ã‚Â©cnico operativo

- [ ] Reemplazar placeholder de `API/src/infrastructure/storage/storage.service.ts` por integraciÃƒÆ’Ã‚Â³n real con Firebase Storage.
- [x] Implementar `generateReinforcementService` como caso de uso explÃƒÆ’Ã‚Â­cito.
- [x] Verificar que existan tests suficientes para use cases, controllers/routes y permisos.
- [x] Verificar que los endpoints tÃƒÆ’Ã‚Â©cnicos estÃƒÆ’Ã‚Â©n documentados para el frontend.

---

## Pendientes tÃƒÆ’Ã‚Â©cnicos

- [ ] Integrar proveedor real de email.
- [ ] Limpieza de tokens expirados.
- [ ] PolÃƒÆ’Ã‚Â­tica de contraseÃƒÆ’Ã‚Â±a.
- [ ] ValidaciÃƒÆ’Ã‚Â³n de expiraciones JWT.
- [ ] Reemplazar placeholder de storage por Firebase Storage real.

---

## Pendientes futuros

### Dashboard

- [ ] `getDashboardSummary`
- [ ] Ventas del mes.
- [ ] Servicios realizados.
- [ ] Servicios pendientes.
- [ ] Clientes activos.
- [ ] PrÃƒÆ’Ã‚Â³ximos servicios.
- [ ] Servicios cancelados o reprogramados.
- [ ] MÃƒÆ’Ã‚Â©tricas basadas en precio histÃƒÆ’Ã‚Â³rico.

### WhatsApp

- [ ] `buildWhatsappLink`.
- [ ] `buildUpcomingServiceMessage`.
- [ ] Usar nombre de empresa desde `system_settings`.
- [ ] Usar fecha prÃƒÆ’Ã‚Â³xima formateada.
- [ ] Usar telÃƒÆ’Ã‚Â©fono cliente/sucursal.
- [ ] Construir URL con `https://wa.me/` y `encodeURIComponent`.

### Frontend

- [ ] Vue 3 con Script Setup y TypeScript.
- [ ] Tailwind con variables CSS.
- [ ] Modo claro / oscuro.
- [ ] Pinia.
- [ ] Componentes base reutilizables.
- [ ] Pantallas administrativas.
- [ ] Pantallas tÃƒÆ’Ã‚Â©cnicas mobile.

---

## Reglas permanentes

- [ ] Todo cÃƒÆ’Ã‚Â³digo nuevo debe incluir tests.
- [ ] No crear cÃƒÆ’Ã‚Â³digo innecesario.
- [ ] No duplicar lÃƒÆ’Ã‚Â³gica.
- [ ] No lÃƒÆ’Ã‚Â³gica de negocio en controllers.
- [ ] No modificar BD sin script SQL.

- [x] ConfiguraciÃƒÆ’Ã‚Â³n por sucursal `technicianRevenueMode` (split/full) implementada en contrato y persistencia.
- [x] Dashboard base implementado: /api/dashboard/summary, /api/dashboard/analytics, /api/dashboard/alerts.

- [x] Hardening dashboard aplicado (completionRate por periodo, validaciones de dimension y filtros en alerts).
- [ ] Pendiente futuro: snapshot historico de technicianRevenueMode para trazabilidad exacta de attributedSales.
- [x] Inicio frontend base en `/Front` con Vue 3 + Vite + TypeScript.
- [x] Tailwind + variables CSS (light/dark), Pinia, Vue Router, auth store base y cliente HTTP centralizado.
- [x] Estructura modular inicial (auth, dashboard, clients, services, settings, layout, technician) y componentes UI base.
- [x] Tests frontend mÃƒÂ­nimos: auth store, guard de rutas, `AppButton`, `ThemeToggle`.
- [ ] Pendiente frontend: implementar pantallas funcionales y flujos completos por mÃƒÂ³dulo (sin placeholders).

- [x] Limpieza inicial del frontend completada: assets/estilos de template removidos y CSS global consolidado en /Front/src/assets/styles/index.css.
- [x] Capa de servicios API frontend implementada por modulo (auth, users, settings, clients, services, dashboard).
- [x] Tipos frontend alineados con `/docs/api.md` en `shared/types` y `modules/*/types`.
- [x] Endpoints centralizados en `/Front/src/shared/api/endpoints.ts`.
- [x] No se crearon stores innecesarios en esta fase (solo se ajusto auth existente).
- [x] Frontend auth real conectado con API (`login`, `logout`, `me`, `forgot-password`, `reset-password`, `refresh`).
- [x] Guards de rutas por rol implementados con redirección para `admin`, `technician` y `admin+technician`.
- [x] Layouts admin/técnico conectados a rutas protegidas.
- [x] Recuperación y reset de contraseña implementados en frontend.
- [x] Base de toggle de contexto admin/técnico implementada con `preferredMode`.
