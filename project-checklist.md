# Project Checklist â€” Soluciones Radicales

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
- [x] `agents.md` en raÃ­z.
- [x] `business-rules.md` en raÃ­z.
- [x] `init.sql` en raÃ­z.
- [x] Scripts SQL definidos para `/Scripts`.
- [x] Backend con Clean Architecture.
- [x] Drizzle usado en infraestructura.
- [x] Vitest configurado.
- [x] Controllers y routes iniciales.
- [x] Middleware central de errores.

---

## Backend â€” Casos de uso implementados

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
- [x] `getBranchHistory` retorna historial bÃ¡sico de `services` por sucursal con filtros opcionales.
- [x] Se mantiene separaciÃ³n entre detalle de cliente e historial para evitar respuestas pesadas.
- [x] Se mantiene separaciÃ³n entre ediciÃ³n de datos bÃ¡sicos de sucursal y configuraciÃ³n para no mezclar validaciones.
- [ ] Si luego se requiere historial enriquecido con tÃ©cnicos, evidencias y mÃ©todo de pago en una sola respuesta, crear un repositorio de lectura especÃ­fico para esa vista. No armar esa lÃ³gica en controllers.

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

### Servicios tÃ©cnicos operativos

- [x] `startService`
- [x] `completeService`
- [x] `addServiceNotes`
- [x] `updateServicePayment`
- [x] `addPaymentProof`
- [x] `addServiceEvidence`
- [x] `listServiceEvidences`
- [x] `generateReinforcementService`

Notas:

- [x] `completeService` actualiza el ciclo y prepara fechas de refuerzo usando la lÃ³gica existente de completado.
- [x] El refuerzo se crea como servicio real en `services`.
- [x] `generateReinforcementService` evita duplicados por sucursal + fecha del refuerzo.
- [x] `completeService` solo actualiza `service_cycles`; no crea refuerzos automÃ¡ticamente.
- [ ] Evaluar si `generateReinforcementService` debe abrirse a tÃ©cnicos asignados; por ahora queda restringido a `admin`.

### Usuarios

- [x] `createUser`
- [x] `getUserById`
- [x] `listTechnicians`
- [x] `updateUser`

### ConfiguraciÃ³n

- [x] `getSystemSettings`
- [x] `updateSystemSettings`
- [x] `createPaymentMethod`
- [x] `listActivePaymentMethods`
- [x] `updatePaymentMethod`
- [x] `disablePaymentMethod`

### AutenticaciÃ³n

- [x] `login`
- [x] `refreshToken`
- [x] `logout`
- [x] `getCurrentUser`
- [x] `changePassword`
- [x] `requestPasswordReset`
- [x] `resetPassword`
- [x] Hash de refresh tokens.
- [x] Hash de reset tokens.
- [x] Middleware de autenticaciÃ³n.
- [x] Middleware de rol.
- [x] Middleware de tÃ©cnico.
- [x] Rutas protegidas.
- [x] Contrato HTTP de `POST /api/auth/forgot-password` alineado al estÃ¡ndar `{ "data": ... }` con `data.success`.

---

## PrÃ³ximo paso recomendado

### DocumentaciÃ³n mÃ­nima de API para frontend

El backend ya cubre autenticaciÃ³n, clientes, servicios, operaciÃ³n tÃ©cnica, refuerzos e historial bÃ¡sico.

Antes de pasar a dashboard o frontend, conviene documentar los endpoints tÃ©cnicos y administrativos ya existentes para que el frontend no tenga que inferir contratos desde controllers.

Pendientes:

- [x] Crear documentaciÃ³n mÃ­nima de endpoints administrativos.
- [x] Crear documentaciÃ³n mÃ­nima de endpoints tÃ©cnicos.
- [x] Documentar payloads principales.
- [x] Documentar respuestas `{ data }` y errores `{ message }`.
- [x] Documentar permisos por endpoint.
- [x] Mantener la documentaciÃ³n simple, preferiblemente en Markdown.

Notas:

- [x] DocumentaciÃ³n creada en `/docs/api.md`.

---

## Pendientes directos del mÃ³dulo tÃ©cnico operativo

- [ ] Reemplazar placeholder de `API/src/infrastructure/storage/storage.service.ts` por integraciÃ³n real con Firebase Storage.
- [x] Implementar `generateReinforcementService` como caso de uso explÃ­cito.
- [x] Verificar que existan tests suficientes para use cases, controllers/routes y permisos.
- [x] Verificar que los endpoints tÃ©cnicos estÃ©n documentados para el frontend.

---

## Pendientes tÃ©cnicos

- [ ] Integrar proveedor real de email.
- [ ] Limpieza de tokens expirados.
- [ ] PolÃ­tica de contraseÃ±a.
- [ ] ValidaciÃ³n de expiraciones JWT.
- [ ] Reemplazar placeholder de storage por Firebase Storage real.

---

## Pendientes futuros

### Dashboard

- [ ] `getDashboardSummary`
- [ ] Ventas del mes.
- [ ] Servicios realizados.
- [ ] Servicios pendientes.
- [ ] Clientes activos.
- [ ] PrÃ³ximos servicios.
- [ ] Servicios cancelados o reprogramados.
- [ ] MÃ©tricas basadas en precio histÃ³rico.

### WhatsApp

- [ ] `buildWhatsappLink`.
- [ ] `buildUpcomingServiceMessage`.
- [ ] Usar nombre de empresa desde `system_settings`.
- [ ] Usar fecha prÃ³xima formateada.
- [ ] Usar telÃ©fono cliente/sucursal.
- [ ] Construir URL con `https://wa.me/` y `encodeURIComponent`.

### Frontend

- [ ] Vue 3 con Script Setup y TypeScript.
- [ ] Tailwind con variables CSS.
- [ ] Modo claro / oscuro.
- [ ] Pinia.
- [ ] Componentes base reutilizables.
- [ ] Pantallas administrativas.
- [ ] Pantallas tÃ©cnicas mobile.

---

## Reglas permanentes

- [ ] Todo cÃ³digo nuevo debe incluir tests.
- [ ] No crear cÃ³digo innecesario.
- [ ] No duplicar lÃ³gica.
- [ ] No lÃ³gica de negocio en controllers.
- [ ] No modificar BD sin script SQL.

- [x] ConfiguraciÃ³n por sucursal `technicianRevenueMode` (split/full) implementada en contrato y persistencia.
- [x] Dashboard base implementado: /api/dashboard/summary, /api/dashboard/analytics, /api/dashboard/alerts.

- [x] Hardening dashboard aplicado (completionRate por periodo, validaciones de dimension y filtros en alerts).
- [ ] Pendiente futuro: snapshot historico de technicianRevenueMode para trazabilidad exacta de attributedSales.
- [x] Inicio frontend base en `/Front` con Vue 3 + Vite + TypeScript.
- [x] Tailwind + variables CSS (light/dark), Pinia, Vue Router, auth store base y cliente HTTP centralizado.
- [x] Estructura modular inicial (auth, dashboard, clients, services, settings, layout, technician) y componentes UI base.
- [x] Tests frontend mínimos: auth store, guard de rutas, `AppButton`, `ThemeToggle`.
- [ ] Pendiente frontend: implementar pantallas funcionales y flujos completos por módulo (sin placeholders).

- [x] Limpieza inicial del frontend completada: assets/estilos de template removidos y CSS global consolidado en /Front/src/assets/styles/index.css.
