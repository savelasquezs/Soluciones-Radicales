# Project Checklist — Soluciones Radicales

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
- [x] `agents.md` en raíz.
- [x] `business-rules.md` en raíz.
- [x] `init.sql` en raíz.
- [x] Scripts SQL definidos para `/Scripts`.
- [x] Backend con Clean Architecture.
- [x] Drizzle usado en infraestructura.
- [x] Vitest configurado.
- [x] Controllers y routes iniciales.
- [x] Middleware central de errores.

---

## Backend — Casos de uso implementados

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
- [x] `getBranchHistory` retorna historial básico de `services` por sucursal con filtros opcionales.
- [x] Se mantiene separación entre detalle de cliente e historial para evitar respuestas pesadas.
- [x] Se mantiene separación entre edición de datos básicos de sucursal y configuración para no mezclar validaciones.
- [ ] Si luego se requiere historial enriquecido con técnicos, evidencias y método de pago en una sola respuesta, crear un repositorio de lectura específico para esa vista. No armar esa lógica en controllers.

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

### Servicios técnicos operativos

- [x] `startService`
- [x] `completeService`
- [x] `addServiceNotes`
- [x] `updateServicePayment`
- [x] `addPaymentProof`
- [x] `addServiceEvidence`
- [x] `listServiceEvidences`
- [x] `generateReinforcementService`

Notas:

- [x] `completeService` actualiza el ciclo y prepara fechas de refuerzo usando la lógica existente de completado.
- [x] El refuerzo se crea como servicio real en `services`.
- [x] `generateReinforcementService` evita duplicados por sucursal + fecha del refuerzo.
- [x] `completeService` solo actualiza `service_cycles`; no crea refuerzos automáticamente.
- [ ] Evaluar si `generateReinforcementService` debe abrirse a técnicos asignados; por ahora queda restringido a `admin`.

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
- [x] Middleware de autenticación.
- [x] Middleware de rol.
- [x] Middleware de técnico.
- [x] Rutas protegidas.

---

## Próximo paso recomendado

### Documentación mínima de API para frontend

El backend ya cubre autenticación, clientes, servicios, operación técnica, refuerzos e historial básico.

Antes de pasar a dashboard o frontend, conviene documentar los endpoints técnicos y administrativos ya existentes para que el frontend no tenga que inferir contratos desde controllers.

Pendientes:

- [x] Crear documentación mínima de endpoints administrativos.
- [x] Crear documentación mínima de endpoints técnicos.
- [x] Documentar payloads principales.
- [x] Documentar respuestas `{ data }` y errores `{ message }`.
- [x] Documentar permisos por endpoint.
- [x] Mantener la documentación simple, preferiblemente en Markdown.

Notas:

- [x] Documentación creada en `/docs/api.md`.

---

## Pendientes directos del módulo técnico operativo

- [ ] Reemplazar placeholder de `API/src/infrastructure/storage/storage.service.ts` por integración real con Firebase Storage.
- [x] Implementar `generateReinforcementService` como caso de uso explícito.
- [x] Verificar que existan tests suficientes para use cases, controllers/routes y permisos.
- [x] Verificar que los endpoints técnicos estén documentados para el frontend.

---

## Pendientes técnicos

- [ ] Integrar proveedor real de email.
- [ ] Limpieza de tokens expirados.
- [ ] Política de contraseña.
- [ ] Validación de expiraciones JWT.
- [ ] Reemplazar placeholder de storage por Firebase Storage real.

---

## Pendientes futuros

### Dashboard

- [ ] `getDashboardSummary`
- [ ] Ventas del mes.
- [ ] Servicios realizados.
- [ ] Servicios pendientes.
- [ ] Clientes activos.
- [ ] Próximos servicios.
- [ ] Servicios cancelados o reprogramados.
- [ ] Métricas basadas en precio histórico.

### WhatsApp

- [ ] `buildWhatsappLink`.
- [ ] `buildUpcomingServiceMessage`.
- [ ] Usar nombre de empresa desde `system_settings`.
- [ ] Usar fecha próxima formateada.
- [ ] Usar teléfono cliente/sucursal.
- [ ] Construir URL con `https://wa.me/` y `encodeURIComponent`.

### Frontend

- [ ] Vue 3 con Script Setup y TypeScript.
- [ ] Tailwind con variables CSS.
- [ ] Modo claro / oscuro.
- [ ] Pinia.
- [ ] Componentes base reutilizables.
- [ ] Pantallas administrativas.
- [ ] Pantallas técnicas mobile.

---

## Reglas permanentes

- [ ] Todo código nuevo debe incluir tests.
- [ ] No crear código innecesario.
- [ ] No duplicar lógica.
- [ ] No lógica de negocio en controllers.
- [ ] No modificar BD sin script SQL.
