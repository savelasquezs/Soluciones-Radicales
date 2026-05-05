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

### Módulo técnico operativo de servicios

Flujo objetivo:

1. Técnico inicia sesión.
2. Ve su programación.
3. Inicia un servicio asignado.
4. Agrega notas.
5. Sube fotos/evidencias.
6. Registra método de pago.
7. Adjunta soporte de pago si aplica.
8. Completa el servicio.
9. El sistema actualiza ciclo y prepara/genera refuerzo.

Casos de uso pendientes:

- [x] `startService`
- [x] `completeService`
- [x] `addServiceNotes`
- [x] `updateServicePayment`
- [x] `addPaymentProof`
- [x] `addServiceEvidence`
- [x] `listServiceEvidences`
- [ ] `generateReinforcementService`

Notas:

- [x] Endpoints tecnicos operativos agregados en `services`.
- [x] Validacion de permisos: admin o tecnico asignado.
- [x] Evidencias y soporte de pago guardan URL, no binario.
- [x] Tests de use cases tecnicos completados para inicio, cierre, notas, pago, soporte y evidencias.
- [x] Tests de endpoints tecnicos completados con escenarios `200`, `401`, `403` y `404` usando mocks.
- [ ] Sigue pendiente `generateReinforcementService`; los tests actuales validan actualizacion de ciclo, no generacion automatica.

---

## Pendientes técnicos

- [ ] Integrar proveedor real de email.
- [ ] Limpieza de tokens expirados.
- [ ] Política de contraseña.
- [ ] Validación de expiraciones JWT.

---

## Reglas permanentes

- [ ] Todo código nuevo debe incluir tests.
- [ ] No crear código innecesario.
- [ ] No duplicar lógica.
- [ ] No lógica de negocio en controllers.
- [ ] No modificar BD sin script SQL.
