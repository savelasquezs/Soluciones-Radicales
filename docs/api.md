# API Backend - Soluciones Radicales

## 1. Introducción

API para operación interna B2B de fumigaciones (autenticación, clientes, servicios, usuarios, configuración).

- Base URL ejemplo: `http://localhost:3000/api`
- Content-Type: `application/json`

Formato estándar:

Success
```json
{ "data": {} }
```

Error
```json
{ "message": "..." }
```

## 2. Autenticación

### `POST /api/auth/login`
- Descripción: autentica usuario y retorna tokens.
- Permisos: público.
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
- Descripción: renueva access token con refresh token.
- Permisos: público.
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
- Descripción: retorna usuario autenticado.
- Permisos: Bearer token requerido.
- Params: ninguno.
- Body: ninguno.
- Respuesta:
```json
{ "data": { "id": "...", "name": "Admin", "email": "admin@demo.com", "role": "admin", "isTechnician": false } }
```
- Errores: `401`.

### `POST /api/auth/forgot-password`
- Descripción: solicita recuperación de contraseña sin revelar existencia del email.
- Permisos: público.
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
- Descripción: restablece contraseña usando token de recuperación.
- Permisos: público.
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

Permiso para todos los endpoints de esta sección: `admin` + token.

### `GET /api/clients`
- Descripción: lista clientes.
- Params: ninguno.
- Body: ninguno.
- Respuesta: `{ "data": [ { "id": "...", "name": "Cliente A" } ] }`

### `GET /api/clients/search?q=...`
- Descripción: busca clientes por nombre.
- Params/query: `q` (string, requerido).
- Body: ninguno.
- Respuesta: `{ "data": [ { "id": "...", "name": "Cliente A" } ] }`

### `GET /api/clients/branches/search?q=...`
- Descripción: busca sucursales para flujo administrativo de creación de servicios.
- Params/query: `q` (string, requerido).
- Body: ninguno.
- Respuesta:
```json
{
  "data": [
    {
      "branchId": "...",
      "branchAddress": "Cra 10 # 20-30",
      "branchPhone": "3001234567",
      "businessId": "...",
      "businessName": "Negocio A",
      "clientId": "...",
      "clientName": "Cliente A",
      "clientPhone": "3010000000",
      "fixedPrice": 250000,
      "pricePerM2": null,
      "city": "Medellín"
    }
  ]
}
```
- Comportamiento: resultado plano con límite interno de 20 registros y orden por relevancia (nombre, teléfono, dirección).

### `GET /api/clients/:id`
- Descripción: obtiene cliente por id.
- Params: `id`.
- Body: ninguno.
- Respuesta: `{ "data": { "id": "...", "name": "Cliente A", "contactName": "Juan", "phone": "300..." } }`

### `GET /api/clients/:id/detail`
- Descripción: detalle agregado de cliente con negocios, sucursales, configuración y ciclo por sucursal.
- Params: `id`.
- Body: ninguno.
- Respuesta: `{ "data": { "client": {}, "businesses": [ { "branches": [ { "configuration": {}, "serviceCycle": {} } ] } ] } }`

### `POST /api/clients`
- Descripción: crea cliente inicial con negocio y sucursal.
- Body:
```json
{
  "client": { "name": "Cliente A", "contactName": "Juan", "phone": "3000000000" },
  "businessName": "Empresa A",
  "branch": { "address": "Calle 1", "city": "Bogotá", "pricePerM2": 1200, "frequencyDays": 30, "reinforcementDays": 10, "reinforcementEnabled": true, "reinforcementIsPaid": false },
  "nextMainServiceDate": "2026-05-10T09:00:00.000Z",
  "createService": true
}
```
- Respuesta: `{ "data": { "client": {}, "business": {}, "branch": {} } }`

### `PATCH /api/clients/:id`
- Descripción: actualiza datos básicos del cliente.
- Params: `id`.
- Body: `{ "name": "Cliente A", "contactName": "Nuevo", "phone": "3001111111" }`
- Respuesta: `{ "data": { "id": "...", "name": "Cliente A" } }`

### `POST /api/clients/:clientId/businesses`
- Descripción: crea negocio para un cliente.
- Params: `clientId`.
- Body: `{ "name": "Nueva Razón Social" }`
- Respuesta: `{ "data": { "id": "...", "clientId": "...", "name": "Nueva Razón Social" } }`

### `PATCH /api/clients/businesses/:businessId`
- Descripción: actualiza nombre de negocio.
- Params: `businessId`.
- Body: `{ "name": "Empresa Renombrada" }`
- Respuesta: `{ "data": { "id": "...", "name": "Empresa Renombrada" } }`

### `POST /api/clients/businesses/:businessId/branches`
- Descripción: crea sucursal en negocio.
- Params: `businessId`.
- Body: `{ "clientId": "...", "address": "Cra 1", "city": "Bogotá", "fixedPrice": 250000 }`
- Respuesta: `{ "data": { "branch": {}, "serviceCycle": {} } }`

### `PATCH /api/clients/branches/:branchId`
- Descripción: actualiza datos básicos/precios de sucursal.
- Params: `branchId`.
- Body: `{ "address": "Nueva dirección", "phone": "3002222222", "city": "Medellín", "pricePerM2": 1300, "fixedPrice": 260000 }`
- Respuesta: `{ "data": { "id": "...", "address": "Nueva dirección" } }`

### `PATCH /api/clients/branches/:branchId/configuration`
- Descripción: actualiza configuración operativa de sucursal.
- Params: `branchId`.
- Body: `{ "frequencyDays": 45, "reinforcementDays": 12, "reinforcementEnabled": true, "reinforcementIsPaid": false }`
- Respuesta: `{ "data": { "id": "...", "frequencyDays": 45 } }`

### `GET /api/clients/branches/:branchId/history`
- Descripción: historial de servicios por sucursal (con filtros).
- Params: `branchId`.
- Query opcional: `from`, `to` (ISO), `status` (`pending|confirmed|in_progress|completed|canceled|rescheduled`), `type` (`main|reinforcement`).
- Body: ninguno.
- Respuesta: `{ "data": { "branch": {}, "services": [ { "id": "...", "status": "completed", "type": "main" } ] } }`

Diferencia clave:
- `GET /clients/:id/detail`: vista estructural (cliente, negocios, sucursales, configuración, ciclos).
- `GET /clients/branches/:branchId/history`: vista temporal (historial de servicios de una sucursal).

## 4. Servicios

Permiso base de rutas: token requerido.  
Regla operativa en casos técnicos: `admin` o técnico asignado (excepto `generate-reinforcement`, actualmente solo admin en use case).

Tipos:
- `main`: servicio principal.
- `reinforcement`: servicio de refuerzo real en `services`.

Flujo técnico recomendado:
`start -> notes -> evidences -> payment -> complete`

### Base

### `POST /api/services`
- Body: `{ "branchId": "...", "scheduledAt": "2026-05-10T09:00:00.000Z", "type": "main", "status": "pending", "price": 250000 }`
- Respuesta: `{ "data": { "id": "...", "type": "main", "status": "pending" } }`

### `GET /api/services/:id`
- Params: `id`.
- Respuesta:
```json
{
  "data": {
    "id": "...",
    "branchId": "...",
    "status": "pending",
    "scheduledAt": "2026-05-20T10:00:00.000Z",
    "type": "main",
    "businessName": "Negocio A",
    "branchName": "Cra 10 # 20-30",
    "branchAddress": "Cra 10 # 20-30",
    "branchPhone": "3001234567",
    "clientName": "Cliente A",
    "clientPhone": "3010000000",
    "paymentMethodName": "Efectivo",
    "technicians": [{ "id": "...", "name": "Técnico 1" }]
  }
}
```

### `GET /api/services/day?date=ISO`
- Query: `date` (requerido).
- Respuesta: `{ "data": [ { "id": "...", "scheduledAt": "..." } ] }`

### `GET /api/services/month?year=2026&month=5`
- Query: `year` y `month` (requeridos).
- Respuesta:
```json
{
  "data": [
    {
      "id": "...",
      "branchId": "...",
      "scheduledAt": "2026-05-20T10:00:00.000Z",
      "status": "pending",
      "type": "main",
      "businessName": "Negocio A",
      "branchName": "Cra 10 # 20-30",
      "branchAddress": "Cra 10 # 20-30",
      "branchPhone": "3001234567",
      "clientName": "Cliente A",
      "clientPhone": "3010000000",
      "technicians": [{ "id": "...", "name": "Técnico 1" }]
    }
  ]
}
```

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
    "technician": { "id": "...", "name": "Técnico 1", "email": "tech1@demo.com", "isTechnician": true },
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

### Operación técnica

### `PATCH /api/services/:id/start`
- Respuesta: `{ "data": { "id": "...", "status": "in_progress" } }`

### `PATCH /api/services/:id/complete`
- Respuesta: `{ "data": { "id": "...", "status": "completed" } }`

### `PATCH /api/services/:id/notes`
- Body: `{ "notes": "Se aplicó tratamiento en cocina y patio." }`
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
- Descripción: crea servicio `reinforcement` real desde un `main` completado.
- Body opcional: `{ "price": 0 }`
- Respuesta: `{ "data": { "id": "...", "type": "reinforcement", "status": "pending", "scheduledAt": "..." } }`
- Regla de duplicados: conflicto si ya existe refuerzo para misma sucursal y misma fecha calculada.

## 5. Usuarios

Permiso para todos los endpoints: `admin` + token.

### `POST /api/users`
- Body: `{ "name": "Técnico 1", "email": "tech1@demo.com", "password": "Secret123", "role": "admin", "isTechnician": true }`
- Respuesta: `{ "data": { "id": "...", "name": "Técnico 1", "isTechnician": true } }`

### `GET /api/users/technicians`
- Respuesta: `{ "data": [ { "id": "...", "name": "Técnico 1", "isTechnician": true } ] }`

### `GET /api/users/:id`
- Respuesta: `{ "data": { "id": "...", "name": "Admin", "email": "admin@demo.com" } }`

### `PATCH /api/users/:id`
- Body: `{ "name": "Nuevo nombre", "email": "nuevo@demo.com", "isTechnician": false }`
- Respuesta: `{ "data": { "id": "...", "name": "Nuevo nombre" } }`

## 6. Configuración

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
- Fechas se envían en ISO string (`2026-05-10T09:00:00.000Z`).
- `/clients`, `/users`, `/settings`: requieren `admin`.
- `/services`: requiere token; autorización fina se valida por caso de uso.
- No persistir binarios en base de datos: soportes/evidencias terminan en URL (`paymentProofUrl`, `fileUrl`).

## Inconsistencias actuales detectadas

- No se detectan inconsistencias activas en formato de respuesta estándar.
## 9. Actualización de contrato - Sucursal y Dashboard

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
- `attributedSales`: ventas atribuidas a técnicos según `technicianRevenueMode` de la sucursal.
- En modo `full`, `attributedSales` puede superar `sales`.

## 10. Hardening dashboard y technicianRevenueMode

- completionRate endurecido: validación de dimensiones permitidas y cálculo por periodo correcto.
- alerts endurecido: aplica filtros solicitados por query para evitar resultados globales no filtrados.
- technicianRevenueMode documentado con regla actual basada en configuración vigente de sucursal.
- pendiente futuro: snapshot histórico de technicianRevenueMode para trazabilidad exacta de attributedSales.

## 11. Notas de contrato frontend para clientes

- `POST /api/clients/businesses/:businessId/branches` responde `{ data: { branch, serviceCycle } }`; no retorna `service`.
- `serviceCycle.lastServiceDate` del backend se normaliza a `lastMainServiceDate` en frontend para mantener consistencia semántica.
- `PATCH /api/clients/branches/:branchId/configuration` acepta `technicianRevenueMode` con valores `split|full`.
- `GET /api/clients/branches/:branchId/history` hoy retorna historial básico de `services` y no incluye técnicos, evidencias ni método de pago enriquecido.

- `createService` no se crea automáticamente en backend durante `createInitialClient` o `addBranchToBusiness`; actualmente solo se crea `serviceCycle` cuando llega `nextMainServiceDate`.
- Frontend administrativo ahora encadena `POST /api/services` después de `createInitialClient` cuando existe `nextMainServiceDate` para crear servicio `main` en estado `pending`.
- Nuevo endpoint: `PATCH /api/clients/branches/:branchId/cycle` para crear/actualizar `service_cycles` por sucursal. Body: `{ nextMainServiceDate, nextReinforcementDate? }`.
- Nuevo endpoint: `GET /api/clients/branches/search?q=...` para selector de sucursal en creación de servicios.
