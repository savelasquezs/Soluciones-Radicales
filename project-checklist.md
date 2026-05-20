# Project Checklist ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â Soluciones Radicales

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
- [x] `agents.md` en raÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­z.
- [x] `business-rules.md` en raÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­z.
- [x] `init.sql` en raÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­z.
- [x] Scripts SQL definidos para `/Scripts`.
- [x] Backend con Clean Architecture.
- [x] Drizzle usado en infraestructura.
- [x] Vitest configurado.
- [x] Controllers y routes iniciales.
- [x] Middleware central de errores.

---

## Backend ÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â¢ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â‚Â¬Ã…Â¡ÃƒÂ‚Ã‚Â¬ÃƒÂƒÃ‚Â¢ÃƒÂ¢Ã¢Â€ÂšÃ‚Â¬ÃƒÂ‚Ã‚Â Casos de uso implementados

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
- [x] `getBranchHistory` retorna historial bÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡sico de `services` por sucursal con filtros opcionales.
- [x] Se mantiene separaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n entre detalle de cliente e historial para evitar respuestas pesadas.
- [x] Se mantiene separaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n entre ediciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n de datos bÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡sicos de sucursal y configuraciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n para no mezclar validaciones.
- [ ] Si luego se requiere historial enriquecido con tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos, evidencias y mÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©todo de pago en una sola respuesta, crear un repositorio de lectura especÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­fico para esa vista. No armar esa lÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³gica en controllers.

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

### Servicios tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos operativos

- [x] `startService`
- [x] `completeService`
- [x] `addServiceNotes`
- [x] `updateServicePayment`
- [x] `addPaymentProof`
- [x] `addServiceEvidence`
- [x] `listServiceEvidences`
- [x] `generateReinforcementService`

Notas:

- [x] `completeService` actualiza el ciclo y prepara fechas de refuerzo usando la lÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³gica existente de completado.
- [x] El refuerzo se crea como servicio real en `services`.
- [x] `generateReinforcementService` evita duplicados por sucursal + fecha del refuerzo.
- [x] `completeService` solo actualiza `service_cycles`; no crea refuerzos automÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ticamente.
- [ ] Evaluar si `generateReinforcementService` debe abrirse a tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos asignados; por ahora queda restringido a `admin`.

### Usuarios

- [x] `createUser`
- [x] `getUserById`
- [x] `listTechnicians`
- [x] `updateUser`

### Configuración

- [x] `getSystemSettings`
- [x] `updateSystemSettings`
- [x] `createPaymentMethod`
- [x] `listActivePaymentMethods`
- [x] `updatePaymentMethod`
- [x] `disablePaymentMethod`
- [x] módulo configuración implementado parcialmente
- [x] /settings implementado como índice
- [x] /settings/company implementado
- [x] /settings/payment-methods implementado
- [x] configuración general conectada
- [x] businessName conectado
- [x] logoUrl conectado sin subida de archivo
- [x] frecuencia por defecto conectada
- [x] refuerzo por defecto conectado
- [x] métodos de pago activos conectados
- [x] crear método de pago conectado
- [x] editar método de pago conectado
- [x] desactivar método de pago conectado
- [x] usuarios/técnicos pendiente para siguiente fase
- [x] logo upload/storage pendiente para fase futura si aplica
- [x] tests de settings agregados

Notas:

- [ ] Faltaría endpoint para listar métodos inactivos si se requiere histórico completo.
- [ ] Faltaría endpoint para subir logo como archivo si se desea soporte real de upload.

### Autenticación

- [x] `login`
- [x] `refreshToken`
- [x] `logout`
- [x] `getCurrentUser`
- [x] `changePassword`
- [x] `requestPasswordReset`
- [x] `resetPassword`
- [x] Hash de refresh tokens.
- [x] Hash de reset tokens.
- [x] Middleware de autenticaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n.
- [x] Middleware de rol.
- [x] Middleware de tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnico.
- [x] Rutas protegidas.
- [x] Contrato HTTP de `POST /api/auth/forgot-password` alineado al estÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡ndar `{ "data": ... }` con `data.success`.

---

## PrÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³ximo paso recomendado

### DocumentaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n mÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­nima de API para frontend

El backend ya cubre autenticaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n, clientes, servicios, operaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnica, refuerzos e historial bÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â¡sico.

Antes de pasar a dashboard o frontend, conviene documentar los endpoints tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos y administrativos ya existentes para que el frontend no tenga que inferir contratos desde controllers.

Pendientes:

- [x] Crear documentaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n mÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­nima de endpoints administrativos.
- [x] Crear documentaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n mÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­nima de endpoints tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos.
- [x] Documentar payloads principales.
- [x] Documentar respuestas `{ data }` y errores `{ message }`.
- [x] Documentar permisos por endpoint.
- [x] Mantener la documentaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n simple, preferiblemente en Markdown.

Notas:

- [x] DocumentaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n creada en `/docs/api.md`.

---

## Pendientes directos del mÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³dulo tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnico operativo

- [ ] Reemplazar placeholder de `API/src/infrastructure/storage/storage.service.ts` por integraciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n real con Firebase Storage.
- [x] Implementar `generateReinforcementService` como caso de uso explÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­cito.
- [x] Verificar que existan tests suficientes para use cases, controllers/routes y permisos.
- [x] Verificar que los endpoints tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos estÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©n documentados para el frontend.

---

## Pendientes tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicos

- [ ] Integrar proveedor real de email.
- [ ] Limpieza de tokens expirados.
- [ ] PolÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â­tica de contraseÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â±a.
- [ ] ValidaciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n de expiraciones JWT.
- [ ] Reemplazar placeholder de storage por Firebase Storage real.

---

## Pendientes futuros

### Dashboard

- [ ] `getDashboardSummary`
- [ ] Ventas del mes.
- [ ] Servicios realizados.
- [ ] Servicios pendientes.
- [ ] Clientes activos.
- [ ] PrÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³ximos servicios.
- [ ] Servicios cancelados o reprogramados.
- [ ] MÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©tricas basadas en precio histÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³rico.

### WhatsApp

- [ ] `buildWhatsappLink`.
- [ ] `buildUpcomingServiceMessage`.
- [ ] Usar nombre de empresa desde `system_settings`.
- [ ] Usar fecha prÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³xima formateada.
- [ ] Usar telÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©fono cliente/sucursal.
- [ ] Construir URL con `https://wa.me/` y `encodeURIComponent`.

### Frontend

- [ ] Vue 3 con Script Setup y TypeScript.
- [ ] Tailwind con variables CSS.
- [ ] Modo claro / oscuro.
- [ ] Pinia.
- [ ] Componentes base reutilizables.
- [ ] Pantallas administrativas.
- [ ] Pantallas tÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â©cnicas mobile.

---

## Reglas permanentes

- [ ] Todo cÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³digo nuevo debe incluir tests.
- [ ] No crear cÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³digo innecesario.
- [ ] No duplicar lÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³gica.
- [ ] No lÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³gica de negocio en controllers.
- [ ] No modificar BD sin script SQL.
- [x] Regla frontend de fechas/horas: usar `AppDatePicker` (`@vuepic/vue-datepicker`) como estandar en formularios y filtros.

- [x] ConfiguraciÃƒÂƒÃ†Â’ÃƒÂ†Ã¢Â€Â™ÃƒÂƒÃ¢Â€ÂšÃƒÂ‚Ã‚Â³n por sucursal `technicianRevenueMode` (split/full) implementada en contrato y persistencia.
- [x] Dashboard base implementado: /api/dashboard/summary, /api/dashboard/analytics, /api/dashboard/alerts.

- [x] Hardening dashboard aplicado (completionRate por periodo, validaciones de dimension y filtros en alerts).
- [ ] Pendiente futuro: snapshot historico de technicianRevenueMode para trazabilidad exacta de attributedSales.
- [x] Inicio frontend base en `/Front` con Vue 3 + Vite + TypeScript.
- [x] Tailwind + variables CSS (light/dark), Pinia, Vue Router, auth store base y cliente HTTP centralizado.
- [x] Estructura modular inicial (auth, dashboard, clients, services, settings, layout, technician) y componentes UI base.
- [x] Tests frontend mÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â­nimos: auth store, guard de rutas, `AppButton`, `ThemeToggle`.
- [ ] Pendiente frontend: implementar pantallas funcionales y flujos completos por mÃƒÂƒÃ†Â’ÃƒÂ‚Ã‚Â³dulo (sin placeholders).

- [x] Limpieza inicial del frontend completada: assets/estilos de template removidos y CSS global consolidado en /Front/src/assets/styles/index.css.
- [x] Capa de servicios API frontend implementada por modulo (auth, users, settings, clients, services, dashboard).
- [x] Tipos frontend alineados con `/docs/api.md` en `shared/types` y `modules/*/types`.
- [x] Endpoints centralizados en `/Front/src/shared/api/endpoints.ts`.
- [x] No se crearon stores innecesarios en esta fase (solo se ajusto auth existente).
- [x] Frontend auth real conectado con API (`login`, `logout`, `me`, `forgot-password`, `reset-password`, `refresh`).
- [x] Guards de rutas por rol implementados con redirecciÃƒÂ³n para `admin`, `technician` y `admin+technician`.
- [x] Layouts admin/tÃƒÂ©cnico conectados a rutas protegidas.
- [x] RecuperaciÃƒÂ³n y reset de contraseÃƒÂ±a implementados en frontend.
- [x] Base de toggle de contexto admin/tÃƒÂ©cnico implementada con `preferredMode`.
- [x] Dashboard administrativo real implementado en frontend.
- [x] Summary conectado a `/api/dashboard/summary`.
- [x] Analytics conectado a `/api/dashboard/analytics` (ventas por periodo, servicios por estado, top clientes).
- [x] Alerts conectado a `/api/dashboard/alerts`.
- [x] PrÃ³ximos servicios conectados a `/api/services/upcoming`.
- [x] Componentes reutilizables de dashboard creados (MetricCard, DateRangeFilter, ChartCard, SimpleBarList, AlertList).
- [x] Tests de dashboard agregados (pÃ¡gina y componentes clave).
- [ ] Pendiente futuro: evaluar librerÃ­a de grÃ¡ficos para visualizaciÃ³n avanzada.
- [x] Encoding validado sin mojibake visible en README y checklist.
- [x] CORS backend configurado para frontend local (`http://localhost:5173`) con `CORS_ORIGIN`.
- [x] Test HTTP de CORS agregado (preflight OPTIONS + origen permitido/no permitido).

### Frontend - Clientes

- [x] Modulo clientes implementado en frontend.
- [x] `/clients` implementado.
- [x] `/clients/:id` implementado.
- [x] `/clients/:id/branches/:branchId/history` implementado.
- [x] Formularios reutilizables de clientes creados.
- [x] Historial de sucursal conectado.
- [x] Regla de comparacion frontend/backend agregada.
- [x] Tests de clientes agregados.
- [x] Flujo frontend de alta de cliente crea servicio inicial `main/pending` cuando hay `nextMainServiceDate`.
- [ ] TODO real: si el historial administrativo necesita tecnicos, evidencias, metodo de pago legible o soportes en una sola respuesta, se requiere endpoint o read model mas rico en backend.

### Frontend - Servicios y calendario administrativo

- [x] FullCalendar instalado.
- [x] Servicios administrativos implementados.
- [x] `/services` implementado.
- [x] `/services/calendar` implementado.
- [x] `/services/:id` implementado.
- [x] Calendario mensual conectado.
- [x] Servicios por día conectado.
- [x] Programación por técnico conectada.
- [x] Creación de servicio conectada.
- [x] Asignación de técnicos conectada.
- [x] Reprogramación conectada.
- [x] Cancelación con confirmación conectada.
- [x] Cambio de estado conectado.
- [x] Refuerzos conectados.
- [x] Métodos de pago conectados.
- [x] Evidencias visibles.
- [x] Tests de servicios agregados.
- [x] Selector de sucursal en creación de servicio conectado a endpoint dedicado `/api/clients/branches/search`.
- [ ] TODO real: backend de servicios no retorna nombre de negocio/sucursal ni técnicos enriquecidos en listados mensuales/diarios; para UI administrativa completa se requiere enriquecer contrato o read model.
- [ ] TODO real: backend de detalle de servicio no retorna payload enriquecido de sucursal/negocio/técnicos en el mismo endpoint.
- [ ] TODO real: carga/subida de evidencias sigue dependiendo de storage real (Firebase) pendiente en backend.
- [ ] TODO real: soporte visual de pago puede requerir endpoint/metadata adicional para vista administrativa enriquecida.

## Frontend - Usuarios y tecnicos (Fase 9)

- [x] /settings/users implementado
- [x] CRUD usuarios/tecnicos implementado en frontend (segun contrato actual)
- [x] pantalla academica Vue creada
- [x] HTML semantico aplicado
- [x] CSS scoped puro aplicado
- [x] codigo comentado en funciones principales
- [x] formulario creacion/edicion implementado
- [x] campo hidden id implementado
- [x] @submit.prevent usado para evitar recarga
- [x] CRUD crear conectado
- [x] CRUD listar conectado (listado de tecnicos + admin autenticado visible)
- [x] CRUD editar conectado
- [ ] CRUD eliminar/desactivar conectado (pendiente por falta de endpoint backend)
- [x] persistencia via API existente
- [x] tests frontend usuarios agregados
- [x] README actualizado

TODOs reales:
- [ ] Falta endpoint para listar todos los usuarios (`GET /api/users`).
- [ ] Falta endpoint para eliminar/desactivar usuarios (`DELETE /api/users/:id` o `PATCH /api/users/:id/disable`).
- [ ] Falta reset password desde admin.
- [ ] Falta estrategia de soft delete en usuarios.
- [x] Endpoint `GET /api/users` implementado.
- [x] Endpoint `PATCH /api/users/:id/disable` implementado.
- [x] Soft disable de usuarios implementado (`users.active`, `users.disabled_at`).
