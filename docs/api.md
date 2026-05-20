# API Backend - Soluciones Radicales

## 1. IntroducciÃ³n

API para operaciÃ³n interna B2B de fumigaciones (autenticaciÃ³n, clientes, servicios, usuarios, configuraciÃ³n).

- Base URL ejemplo: `http://localhost:3000/api`
- Content-Type: `application/json`

Formato estÃ¡ndar:

Success
```json
{ "data": {} }
```

Error
```json
{ "message": "..." }
```

## 2. AutenticaciÃ³n

### `POST /api/auth/login`
- DescripciÃ³n: autentica usuario y retorna tokens.
- Permisos: pÃºblico.
- Body:
```json
{ "email": "admin@demo.com", "password": "Secret123" }
```
- Respuesta:
```json
{ "data": { "accessToken": "...", "refreshToken": "...", "user": { "id": "...", "role": "admin", "isTechnician": false } } }
```
- Errores: `400`, `401`.

### `POST /api/auth/refresh`
- DescripciÃ³n: renueva access token con refresh token.
- Permisos: pÃºblico.
- Body:
```json
{ "refreshToken": "..." }
```
- Respuesta:
```json
{ "data": { "accessToken": "...", "refreshToken": "..." } }
```
- Errores: `400`, `401`.

### `GET /api/auth/me`
- DescripciÃ³n: retorna usuario autenticado.
- Permisos: Bearer token requerido.
- Params: ninguno.
- Body: ninguno.
- Respuesta:
```json
{ "data": { "id": "...", "name": "Admin", "email": "admin@demo.com", "role": "admin", "isTechnician": false } }
```
- Errores: `401`.

### `POST /api/auth/forgot-password`
- DescripciÃ³n: solicita recuperaciÃ³n de contraseÃ±a sin revelar existencia del email.
- Permisos: pÃºblico.
- Body:
```json
{ "email": "admin@demo.com" }
```
- Respuesta:
```json
{ "data": { "success": true } }
```
- Errores: `400`.

### `POST /api/auth/reset-password`
- DescripciÃ³n: restablece contraseÃ±a usando token de recuperaciÃ³n.
- Permisos: pÃºblico.
- Body:
```json
{ "token": "...", "newPassword": "Secret123" }
```
- Respuesta:
```json
{ "data": { "success": true } }
```
- Errores: `400`, `404`.

Uso de token:
```http
Authorization: Bearer <accessToken>
```

## 3. Clientes

Permiso para todos los endpoints de esta secciÃ³n: `admin` + token.

### `GET /api/clients`
- DescripciÃ³n: lista clientes.
- Params: ninguno.
- Body: ninguno.
- Respuesta: `{ "data": [ { "id": "...", "name": "Cliente A" } ] }`

### `GET /api/clients/search?q=...`
- DescripciÃ³n: busca clientes por nombre.
- Params/query: `q` (string, requerido).
- Body: ninguno.
- Respuesta: `{ "data": [ { "id": "...", "name": "Cliente A" } ] }`

### `GET /api/clients/:id`
- DescripciÃ³n: obtiene cliente por id.
- Params: `id`.
- Body: ninguno.
- Respuesta: `{ "data": { "id": "...", "name": "Cliente A", "contactName": "Juan", "phone": "300..." } }`

### `GET /api/clients/:id/detail`
- DescripciÃ³n: detalle agregado de cliente con negocios, sucursales, configuraciÃ³n y ciclo por sucursal.
- Params: `id`.
- Body: ninguno.
- Respuesta: `{ "data": { "client": {}, "businesses": [ { "branches": [ { "configuration": {}, "serviceCycle": {} } ] } ] } }`

### `POST /api/clients`
- DescripciÃ³n: crea cliente inicial con negocio y sucursal.
- Body:
```json
{
  "client": { "name": "Cliente A", "contactName": "Juan", "phone": "3000000000" },
  "businessName": "Empresa A",
  "branch": { "address": "Calle 1", "city": "BogotÃ¡", "pricePerM2": 1200, "frequencyDays": 30, "reinforcementDays": 10, "reinforcementEnabled": true, "reinforcementIsPaid": false },
  "nextMainServiceDate": "2026-05-10T09:00:00.000Z",
  "createService": true
}
```
- Respuesta: `{ "data": { "client": {}, "business": {}, "branch": {} } }`

### `PATCH /api/clients/:id`
- DescripciÃ³n: actualiza datos bÃ¡sicos del cliente.
- Params: `id`.
- Body: `{ "name": "Cliente A", "contactName": "Nuevo", "phone": "3001111111" }`
- Respuesta: `{ "data": { "id": "...", "name": "Cliente A" } }`

### `POST /api/clients/:clientId/businesses`
- DescripciÃ³n: crea negocio para un cliente.
- Params: `clientId`.
- Body: `{ "name": "Nueva RazÃ³n Social" }`
- Respuesta: `{ "data": { "id": "...", "clientId": "...", "name": "Nueva RazÃ³n Social" } }`

### `PATCH /api/clients/businesses/:businessId`
- DescripciÃ³n: actualiza nombre de negocio.
- Params: `businessId`.
- Body: `{ "name": "Empresa Renombrada" }`
- Respuesta: `{ "data": { "id": "...", "name": "Empresa Renombrada" } }`

### `POST /api/clients/businesses/:businessId/branches`
- DescripciÃ³n: crea sucursal en negocio.
- Params: `businessId`.
- Body: `{ "clientId": "...", "address": "Cra 1", "city": "BogotÃ¡", "fixedPrice": 250000 }`
- Respuesta: `{ "data": { "branch": {}, "serviceCycle": {} } }`

### `PATCH /api/clients/branches/:branchId`
- DescripciÃ³n: actualiza datos bÃ¡sicos/precios de sucursal.
- Params: `branchId`.
- Body: `{ "address": "Nueva direcciÃ³n", "phone": "3002222222", "city": "MedellÃ­n", "pricePerM2": 1300, "fixedPrice": 260000 }`
- Respuesta: `{ "data": { "id": "...", "address": "Nueva direcciÃ³n" } }`

### `PATCH /api/clients/branches/:branchId/configuration`
- DescripciÃ³n: actualiza configuraciÃ³n operativa de sucursal.
- Params: `branchId`.
- Body: `{ "frequencyDays": 45, "reinforcementDays": 12, "reinforcementEnabled": true, "reinforcementIsPaid": false }`
- Respuesta: `{ "data": { "id": "...", "frequencyDays": 45 } }`

### `GET /api/clients/branches/:branchId/history`
- DescripciÃ³n: historial de servicios por sucursal (con filtros).
- Params: `branchId`.
- Query opcional: `from`, `to` (ISO), `status` (`pending|confirmed|in_progress|completed|canceled|rescheduled`), `type` (`main|reinforcement`).
- Body: ninguno.
- Respuesta: `{ "data": { "branch": {}, "services": [ { "id": "...", "status": "completed", "type": "main" } ] } }`

Diferencia clave:
- `GET /clients/:id/detail`: vista estructural (cliente, negocios, sucursales, configuraciÃ³n, ciclos).
- `GET /clients/branches/:branchId/history`: vista temporal (historial de servicios de una sucursal).

## 4. Servicios

Permiso base de rutas: token requerido.  
Regla operativa en casos tÃ©cnicos: `admin` o tÃ©cnico asignado (excepto `generate-reinforcement`, actualmente solo admin en use case).

Tipos:
- `main`: servicio principal.
- `reinforcement`: servicio de refuerzo real en `services`.

Flujo tÃ©cnico recomendado:
`start -> notes -> evidences -> payment -> complete`

### Base

### `POST /api/services`
- Body: `{ "branchId": "...", "scheduledAt": "2026-05-10T09:00:00.000Z", "type": "main", "status": "pending", "price": 250000 }`
- Respuesta: `{ "data": { "id": "...", "type": "main", "status": "pending" } }`

### `GET /api/services/:id`
- Params: `id`.
- Respuesta: `{ "data": { "id": "...", "branchId": "...", "status": "pending" } }`

### `GET /api/services/day?date=ISO`
- Query: `date` (requerido).
- Respuesta: `{ "data": [ { "id": "...", "scheduledAt": "..." } ] }`

### `GET /api/services/month?year=2026&month=5`
- Query: `year` y `month` (requeridos).
- Respuesta: `{ "data": [ { "id": "...", "scheduledAt": "..." } ] }`

### `GET /api/services/upcoming?days=7`
- Query opcional: `days`.
- Respuesta: `{ "data": [ { "id": "...", "scheduledAt": "..." } ] }`

### `GET /api/services/technician/:technicianId/schedule`
- Params: `technicianId`.
- Query opcional: `from`, `to`.
- Respuesta real backend:
```json
{
  "data": {
    "technician": { "id": "...", "name": "Tecnico 1", "email": "tech1@demo.com", "isTechnician": true },
    "services": [ { "id": "...", "scheduledAt": "..." } ]
  }
}
```

### `PATCH /api/services/:id/status`
- Body: `{ "status": "confirmed" }`
- Respuesta: `{ "data": { "id": "...", "status": "confirmed" } }`

### `PATCH /api/services/:id/reschedule`
- Body: `{ "scheduledAt": "2026-05-11T09:00:00.000Z" }`
- Respuesta: `{ "data": { "id": "...", "scheduledAt": "..." } }`

### `PATCH /api/services/:id/cancel`
- Body: opcional (`actorUserId`).
- Respuesta: `{ "data": { "id": "...", "status": "canceled" } }`

### `POST /api/services/:id/technicians`
- Body: `{ "technicianIds": ["tech-1", "tech-2"] }`
- Respuesta: `{ "data": { "success": true } }`

### OperaciÃ³n tÃ©cnica

### `PATCH /api/services/:id/start`
- Respuesta: `{ "data": { "id": "...", "status": "in_progress" } }`

### `PATCH /api/services/:id/complete`
- Respuesta: `{ "data": { "id": "...", "status": "completed" } }`

### `PATCH /api/services/:id/notes`
- Body: `{ "notes": "Se aplicÃ³ tratamiento en cocina y patio." }`
- Respuesta: `{ "data": { "id": "...", "notes": "..." } }`

### `PATCH /api/services/:id/payment`
- Body: `{ "paymentMethodId": "pm-1" }`
- Respuesta: `{ "data": { "id": "...", "paymentMethodId": "pm-1" } }`

### `POST /api/services/:id/payment-proof`
- Body:
```json
{ "fileName": "comprobante.jpg", "contentType": "image/jpeg", "contentBase64": "..." }
```
- Respuesta: `{ "data": { "id": "...", "paymentProofUrl": "https://..." } }`

### `POST /api/services/:id/evidences`
- Body:
```json
{ "fileName": "evidencia-1.jpg", "contentType": "image/jpeg", "contentBase64": "..." }
```
- Respuesta: `{ "data": { "id": "...", "serviceId": "...", "fileUrl": "https://..." } }`

### `GET /api/services/:id/evidences`
- Respuesta: `{ "data": [ { "id": "...", "serviceId": "...", "fileUrl": "https://..." } ] }`

### Refuerzos

### `POST /api/services/:id/generate-reinforcement`
- DescripciÃ³n: crea servicio `reinforcement` real desde un `main` completado.
- Body opcional: `{ "price": 0 }`
- Respuesta: `{ "data": { "id": "...", "type": "reinforcement", "status": "pending", "scheduledAt": "..." } }`
- Regla de duplicados: conflicto si ya existe refuerzo para misma sucursal y misma fecha calculada.

## 5. Usuarios

Permiso para todos los endpoints: `admin` + token.

### `POST /api/users`
- Body: `{ "name": "Tecnico 1", "email": "tech1@demo.com", "password": "Secret123", "role": "admin", "isTechnician": true }`
- Respuesta: `{ "data": { "id": "...", "name": "Tecnico 1", "isTechnician": true } }`

### `GET /api/users/technicians`
- Respuesta: `{ "data": [ { "id": "...", "name": "Tecnico 1", "isTechnician": true } ] }`

### `GET /api/users/:id`
- Respuesta: `{ "data": { "id": "...", "name": "Admin", "email": "admin@demo.com" } }`

### `PATCH /api/users/:id`
- Body: `{ "name": "Nuevo nombre", "email": "nuevo@demo.com", "isTechnician": false }`
- Respuesta: `{ "data": { "id": "...", "name": "Nuevo nombre" } }`

## 6. ConfiguraciÃ³n

Permiso para todos los endpoints: `admin` + token.

### `GET /api/settings`
- Respuesta: `{ "data": { "businessName": "Soluciones Radicales", "defaultFrequencyDays": 30 } }`

### `PATCH /api/settings`
- Body: `{ "businessName": "SR", "defaultFrequencyDays": 30, "defaultReinforcementDays": 10, "reinforcementEnabledDefault": true, "reinforcementIsPaidDefault": false }`
- Respuesta: `{ "data": { "businessName": "SR" } }`

### `GET /api/settings/payment-methods`
- Respuesta: `{ "data": [ { "id": "...", "name": "Efectivo", "type": "cash", "active": true } ] }`

### `POST /api/settings/payment-methods`
- Body: `{ "name": "Transferencia", "type": "bank", "active": true }`
- Respuesta: `{ "data": { "id": "...", "name": "Transferencia", "type": "bank", "active": true } }`

### `PATCH /api/settings/payment-methods/:id`
- Body: `{ "name": "Transferencia bancaria", "type": "bank", "active": true }`
- Respuesta: `{ "data": { "id": "...", "name": "Transferencia bancaria" } }`

### `PATCH /api/settings/payment-methods/:id/disable`
- Body: opcional (`actorUserId`).
- Respuesta: `{ "data": { "success": true } }`

## 7. Convenciones importantes

- Todos los endpoints usan JSON.
- Errores siguen `{"message":"..."}`.
- Fechas se envÃ­an en ISO string (`2026-05-10T09:00:00.000Z`).
- `/clients`, `/users`, `/settings`: requieren `admin`.
- `/services`: requiere token; autorizaciÃ³n fina se valida por caso de uso.
- No persistir binarios en base de datos: soportes/evidencias terminan en URL (`paymentProofUrl`, `fileUrl`).

## Inconsistencias actuales detectadas

- No se detectan inconsistencias activas en formato de respuesta estÃ¡ndar.
## 9. Actualizacion de contrato - Sucursal y Dashboard

### PATCH /api/clients/branches/:branchId/configuration
Body acepta adicionalmente:

```json
{ "technicianRevenueMode": "split" }
```

Valores permitidos de `technicianRevenueMode`:
- `split`
- `full`

### Dashboard (`/api/dashboard`)
Todos requieren `admin` + token.

#### GET /api/dashboard/summary
Query opcional: `from`, `to`, `technicianId`, `clientId`, `businessId`, `branchId`, `status`, `type`, `paymentMethodId`.
Respuesta:
```json
{
  "data": {
    "salesTotal": 0,
    "servicesTotal": 0,
    "servicesCompleted": 0,
    "servicesPending": 0,
    "servicesCanceled": 0,
    "servicesRescheduled": 0,
    "overdueServices": 0,
    "activeClients": 0,
    "activeBranches": 0,
    "completionRate": 0
  }
}
```

#### GET /api/dashboard/analytics
- `metric` requerido: `sales`, `attributedSales`, `services`, `completedServices`, `pendingServices`, `canceledServices`, `rescheduledServices`, `reinforcements`, `evidences`, `completionRate`.
- `groupBy` opcional: `day`, `week`, `month`, `quarter`, `year`.
- `dimension` opcional: `status`, `serviceType`, `paymentMethod`, `technician`, `client`, `business`, `branch`, `paidStatus`.
- Filtros opcionales: `from`, `to`, `technicianId`, `clientId`, `businessId`, `branchId`, `status`, `type`, `paymentMethodId`.
- `sort` opcional: `asc|desc` (default `desc`).
- `limit` opcional: max 50.
- `groupBy` y `dimension` no se usan juntos.
- `attributedSales` requiere `dimension=technician` o `technicianId`.

#### GET /api/dashboard/alerts
Query opcional: `from`, `to`, `technicianId`, `clientId`, `businessId`, `branchId`.
Respuesta:
```json
{
  "data": {
    "overdueServices": [],
    "overdueCycles": [],
    "pendingReinforcements": [],
    "transfersWithoutProof": [],
    "completedWithoutEvidence": []
  }
}
```

### sales vs attributedSales
- `sales`: ventas reales del negocio (cada servicio cuenta una sola vez).
- `attributedSales`: ventas atribuidas a tecnicos segun `technicianRevenueMode` de la sucursal.
- En modo `full`, `attributedSales` puede superar `sales`.

## 10. Hardening dashboard y technicianRevenueMode

- completionRate endurecido: validacion de dimensiones permitidas y calculo por periodo correcto.
- alerts endurecido: aplica filtros solicitados por query para evitar resultados globales no filtrados.
- technicianRevenueMode documentado con regla actual basada en configuracion vigente de sucursal.
- pendiente futuro: snapshot historico de technicianRevenueMode para trazabilidad exacta de attributedSales.

## 11. Notas de contrato frontend para clientes

- `POST /api/clients/businesses/:businessId/branches` responde `{ data: { branch, serviceCycle } }`; no retorna `service`.
- `serviceCycle.lastServiceDate` del backend se normaliza a `lastMainServiceDate` en frontend para mantener consistencia semantica.
- `PATCH /api/clients/branches/:branchId/configuration` acepta `technicianRevenueMode` con valores `split|full`.
- `GET /api/clients/branches/:branchId/history` hoy retorna historial basico de `services` y no incluye tecnicos, evidencias ni metodo de pago enriquecido.

- `createService` hoy no crea un servicio real en `createInitialClient` ni en `addBranchToBusiness`; actualmente solo se crea `serviceCycle` cuando llega `nextMainServiceDate`.
- Nuevo endpoint: `PATCH /api/clients/branches/:branchId/cycle` para crear/actualizar `service_cycles` por sucursal. Body: `{ nextMainServiceDate, nextReinforcementDate? }`.
