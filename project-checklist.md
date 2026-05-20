# Project Checklist Ã¢â‚¬â€ Soluciones Radicales

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
- [x] `agents.md` en raÃƒÂ­z.
- [x] `business-rules.md` en raÃƒÂ­z.
- [x] `init.sql` en raÃƒÂ­z.
- [x] Scripts SQL definidos para `/Scripts`.
- [x] Backend con Clean Architecture.
- [x] Drizzle usado en infraestructura.
- [x] Vitest configurado.
- [x] Controllers y routes iniciales.
- [x] Middleware central de errores.

---

## Backend Ã¢â‚¬â€ Casos de uso implementados

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
- [x] `getBranchHistory` retorna historial bÃƒÂ¡sico de `services` por sucursal con filtros opcionales.
- [x] Se mantiene separaciÃƒÂ³n entre detalle de cliente e historial para evitar respuestas pesadas.
- [x] Se mantiene separaciÃƒÂ³n entre ediciÃƒÂ³n de datos bÃƒÂ¡sicos de sucursal y configuraciÃƒÂ³n para no mezclar validaciones.
- [ ] Si luego se requiere historial enriquecido con tÃƒÂ©cnicos, evidencias y mÃƒÂ©todo de pago en una sola respuesta, crear un repositorio de lectura especÃƒÂ­fico para esa vista. No armar esa lÃƒÂ³gica en controllers.

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

### Servicios tÃƒÂ©cnicos operativos

- [x] `startService`
- [x] `completeService`
- [x] `addServiceNotes`
- [x] `updateServicePayment`
- [x] `addPaymentProof`
- [x] `addServiceEvidence`
- [x] `listServiceEvidences`
- [x] `generateReinforcementService`

Notas:

- [x] `completeService` actualiza el ciclo y prepara fechas de refuerzo usando la lÃƒÂ³gica existente de completado.
- [x] El refuerzo se crea como servicio real en `services`.
- [x] `generateReinforcementService` evita duplicados por sucursal + fecha del refuerzo.
- [x] `completeService` solo actualiza `service_cycles`; no crea refuerzos automÃƒÂ¡ticamente.
- [ ] Evaluar si `generateReinforcementService` debe abrirse a tÃƒÂ©cnicos asignados; por ahora queda restringido a `admin`.

### Usuarios

- [x] `createUser`
- [x] `getUserById`
- [x] `listTechnicians`
- [x] `updateUser`

### ConfiguraciÃƒÂ³n

- [x] `getSystemSettings`
- [x] `updateSystemSettings`
- [x] `createPaymentMethod`
- [x] `listActivePaymentMethods`
- [x] `updatePaymentMethod`
- [x] `disablePaymentMethod`

### AutenticaciÃƒÂ³n

- [x] `login`
- [x] `refreshToken`
- [x] `logout`
- [x] `getCurrentUser`
- [x] `changePassword`
- [x] `requestPasswordReset`
- [x] `resetPassword`
- [x] Hash de refresh tokens.
- [x] Hash de reset tokens.
- [x] Middleware de autenticaciÃƒÂ³n.
- [x] Middleware de rol.
- [x] Middleware de tÃƒÂ©cnico.
- [x] Rutas protegidas.
- [x] Contrato HTTP de `POST /api/auth/forgot-password` alineado al estÃƒÂ¡ndar `{ "data": ... }` con `data.success`.

---

## PrÃƒÂ³ximo paso recomendado

### DocumentaciÃƒÂ³n mÃƒÂ­nima de API para frontend

El backend ya cubre autenticaciÃƒÂ³n, clientes, servicios, operaciÃƒÂ³n tÃƒÂ©cnica, refuerzos e historial bÃƒÂ¡sico.

Antes de pasar a dashboard o frontend, conviene documentar los endpoints tÃƒÂ©cnicos y administrativos ya existentes para que el frontend no tenga que inferir contratos desde controllers.

Pendientes:

- [x] Crear documentaciÃƒÂ³n mÃƒÂ­nima de endpoints administrativos.
- [x] Crear documentaciÃƒÂ³n mÃƒÂ­nima de endpoints tÃƒÂ©cnicos.
- [x] Documentar payloads principales.
- [x] Documentar respuestas `{ data }` y errores `{ message }`.
- [x] Documentar permisos por endpoint.
- [x] Mantener la documentaciÃƒÂ³n simple, preferiblemente en Markdown.

Notas:

- [x] DocumentaciÃƒÂ³n creada en `/docs/api.md`.

---

## Pendientes directos del mÃƒÂ³dulo tÃƒÂ©cnico operativo

- [ ] Reemplazar placeholder de `API/src/infrastructure/storage/storage.service.ts` por integraciÃƒÂ³n real con Firebase Storage.
- [x] Implementar `generateReinforcementService` como caso de uso explÃƒÂ­cito.
- [x] Verificar que existan tests suficientes para use cases, controllers/routes y permisos.
- [x] Verificar que los endpoints tÃƒÂ©cnicos estÃƒÂ©n documentados para el frontend.

---

## Pendientes tÃƒÂ©cnicos

- [ ] Integrar proveedor real de email.
- [ ] Limpieza de tokens expirados.
- [ ] PolÃƒÂ­tica de contraseÃƒÂ±a.
- [ ] ValidaciÃƒÂ³n de expiraciones JWT.
- [ ] Reemplazar placeholder de storage por Firebase Storage real.

---

## Pendientes futuros

### Dashboard

- [ ] `getDashboardSummary`
- [ ] Ventas del mes.
- [ ] Servicios realizados.
- [ ] Servicios pendientes.
- [ ] Clientes activos.
- [ ] PrÃƒÂ³ximos servicios.
- [ ] Servicios cancelados o reprogramados.
- [ ] MÃƒÂ©tricas basadas en precio histÃƒÂ³rico.

### WhatsApp

- [ ] `buildWhatsappLink`.
- [ ] `buildUpcomingServiceMessage`.
- [ ] Usar nombre de empresa desde `system_settings`.
- [ ] Usar fecha prÃƒÂ³xima formateada.
- [ ] Usar telÃƒÂ©fono cliente/sucursal.
- [ ] Construir URL con `https://wa.me/` y `encodeURIComponent`.

### Frontend

- [ ] Vue 3 con Script Setup y TypeScript.
- [ ] Tailwind con variables CSS.
- [ ] Modo claro / oscuro.
- [ ] Pinia.
- [ ] Componentes base reutilizables.
- [ ] Pantallas administrativas.
- [ ] Pantallas tÃƒÂ©cnicas mobile.

---

## Reglas permanentes

- [ ] Todo cÃƒÂ³digo nuevo debe incluir tests.
- [ ] No crear cÃƒÂ³digo innecesario.
- [ ] No duplicar lÃƒÂ³gica.
- [ ] No lÃƒÂ³gica de negocio en controllers.
- [ ] No modificar BD sin script SQL.

- [x] ConfiguraciÃƒÂ³n por sucursal `technicianRevenueMode` (split/full) implementada en contrato y persistencia.
- [x] Dashboard base implementado: /api/dashboard/summary, /api/dashboard/analytics, /api/dashboard/alerts.

- [x] Hardening dashboard aplicado (completionRate por periodo, validaciones de dimension y filtros en alerts).
- [ ] Pendiente futuro: snapshot historico de technicianRevenueMode para trazabilidad exacta de attributedSales.
- [x] Inicio frontend base en `/Front` con Vue 3 + Vite + TypeScript.
- [x] Tailwind + variables CSS (light/dark), Pinia, Vue Router, auth store base y cliente HTTP centralizado.
- [x] Estructura modular inicial (auth, dashboard, clients, services, settings, layout, technician) y componentes UI base.
- [x] Tests frontend mÃ­nimos: auth store, guard de rutas, `AppButton`, `ThemeToggle`.
- [ ] Pendiente frontend: implementar pantallas funcionales y flujos completos por mÃ³dulo (sin placeholders).

- [x] Limpieza inicial del frontend completada: assets/estilos de template removidos y CSS global consolidado en /Front/src/assets/styles/index.css.
- [x] Capa de servicios API frontend implementada por modulo (auth, users, settings, clients, services, dashboard).
- [x] Tipos frontend alineados con `/docs/api.md` en `shared/types` y `modules/*/types`.
- [x] Endpoints centralizados en `/Front/src/shared/api/endpoints.ts`.
- [x] No se crearon stores innecesarios en esta fase (solo se ajusto auth existente).
