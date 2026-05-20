# Business Rules — Soluciones Radicales

Este documento define las reglas de negocio del sistema interno de gestión de fumigaciones B2B.

Todo cambio funcional debe revisar este archivo antes de implementarse.  
Si una nueva funcionalidad introduce reglas nuevas, este documento debe actualizarse.

---

## 1. Roles y acceso

El sistema no tendrá registro público de usuarios.

El primer administrador se crea directamente desde la base de datos.

Los administradores pueden crear usuarios operarios/técnicos y darles acceso al sistema.

El sistema maneja roles simples:

- `admin`
- usuario con flag `is_technician = true`

Un administrador también puede ser técnico si tiene `is_technician = true`.

En mobile, un administrador técnico puede alternar entre vista administrativa y vista técnica desde su perfil.

---

## 2. Autenticación

La autenticación se realiza con email y contraseña.

El backend debe usar:

- JWT access token
- refresh token

No se permite crear cuentas desde el frontend público.

---

## 3. Jerarquía comercial

La estructura principal del negocio es:

Cliente → Negocio → Sucursal

Un cliente puede tener varios negocios.

Un negocio puede tener varias sucursales.

Cada sucursal tiene:

- dirección propia
- teléfono propio
- ciudad
- historial de servicios
- valor de fumigación propio
- configuración propia de frecuencia y refuerzo

---

## 4. Creación inicial de clientes

Al crear un cliente por primera vez, la interfaz no debe mostrar formularios separados para cliente, negocio y sucursal.

Debe existir un formulario único de creación rápida que cree internamente:

- cliente
- negocio inicial
- sucursal inicial
- ciclo de servicio inicial, si aplica

Después de creado el cliente, desde su detalle se pueden agregar más negocios y sucursales.

---

## 5. Configuración global del sistema

El sistema debe tener una configuración global reutilizable.

La configuración incluye:

- nombre de la empresa
- logo
- frecuencia por defecto entre fumigaciones principales
- días por defecto para refuerzo
- si el refuerzo está habilitado por defecto
- si el refuerzo es pago por defecto

El nombre de la empresa debe reutilizarse en mensajes, interfaz y lugares necesarios.

El logo debe reutilizarse en la interfaz, favicon y lugares necesarios.

Los valores globales funcionan como defaults, pero pueden ser sobrescritos por sucursal.

---

## 6. Configuración por sucursal

Cada sucursal puede tener configuración propia.

La configuración por sucursal puede definir:

- precio por metro cuadrado
- precio fijo
- frecuencia de fumigación principal
- días para fumigación de refuerzo
- si tiene refuerzo
- si el refuerzo es pago

Si una sucursal no tiene valores propios, se deben usar los valores globales del sistema.

No se deben asumir valores mágicos en código.

---

## 7. Servicios de fumigación

Un servicio representa una fumigación programada o realizada.

Los tipos de servicio son:

- `main`
- `reinforcement`

Un servicio principal es la fumigación periódica principal.

Un servicio de refuerzo puede programarse después de una fumigación principal según la configuración de la sucursal o del sistema.

Estados permitidos del servicio:

- `pending`
- `confirmed`
- `in_progress`
- `completed`
- `canceled`
- `rescheduled`

---

## 8. Ciclos de servicio

Cada sucursal debe tener como máximo un ciclo activo de servicio.

El ciclo de servicio mantiene:

- última fecha de servicio principal
- próxima fecha de servicio principal
- próxima fecha de refuerzo
- estado activo/inactivo

El dashboard y las alertas de próximos servicios deben consultar principalmente los ciclos de servicio.

---

## 9. Programación de fumigaciones

Una fumigación se asigna a:

- una sucursal
- una fecha y hora
- uno o varios técnicos

Antes de asignar técnicos, el sistema debe validar disponibilidad.

No se debe asignar un técnico a dos servicios en horarios incompatibles.

La duración exacta del servicio puede definirse más adelante; mientras no exista duración formal, la validación debe prepararse para soportarla sin romper el diseño.

---

## 10. Servicios próximos

La pantalla principal administrativa debe mostrar empresas, negocios o sucursales con fumigaciones próximas.

Debe existir acción rápida para contactar por WhatsApp al cliente o sucursal.

También debe permitir:

- reprogramar contacto o próxima fumigación
- descartar para no volver a llamar
- programar servicio

Si un cliente posterga, debe poder modificarse la próxima fecha para contactarlo nuevamente.

Si se descarta, no debe volver a aparecer en la lista de próximos contactos mientras el ciclo esté marcado como inactivo o descartado según la implementación.

---

## 11. WhatsApp

La integración inicial con WhatsApp será mediante link directo.

No se usará API oficial al inicio.

El mensaje debe generarse dinámicamente usando:

- nombre del remitente
- nombre de la empresa desde configuración
- fecha próxima del servicio
- teléfono del cliente o sucursal

Ejemplo de mensaje:

> Buenas tardes, habla Juan Dario de Soluciones Radicales. Tu próximo servicio de fumigación está programado para el martes 12 de mayo. ¿Deseas que lo agendemos para esta fecha?

El link debe construirse con `https://wa.me/` y el mensaje debe ir codificado con `encodeURIComponent`.

---

## 12. Refuerzos

Un servicio principal puede generar un servicio de refuerzo.

La fecha del refuerzo se calcula con:

fecha del servicio principal + días de refuerzo configurados

La configuración de refuerzo se resuelve así:

1. configuración de la sucursal
2. configuración global del sistema

El refuerzo puede ser pago o gratuito.

Si el refuerzo no es pago, su precio debe registrarse como 0 o mantenerse explícitamente como gratuito según la implementación definida.

El sistema no debe generar refuerzos si el refuerzo está deshabilitado para la sucursal.

---

## 13. Pagos

Los métodos de pago son dinámicos y configurables.

Ejemplos:

- efectivo
- cuenta Juan
- cuenta Daniel
- Bancolombia
- Davivienda

Los servicios deben guardar el método de pago utilizado.

Si el pago es por transferencia u otro método que requiera soporte, el técnico puede adjuntar una imagen del soporte.

El sistema debe guardar el valor histórico del servicio.

No se deben recalcular precios de servicios ya creados o completados.

---

## 14. Evidencias del servicio

El técnico puede adjuntar fotos del servicio realizado.

Las imágenes se almacenan en Firebase Storage.

PostgreSQL solo debe guardar las URLs de las imágenes.

Pueden ver las fotos:

- administradores
- técnico asignado al servicio

Otros técnicos no deben ver evidencias de servicios en los que no participaron, salvo que también sean administradores.

---

## 15. Vista del técnico

Al iniciar sesión, un técnico debe ver su programación.

La vista técnica debe priorizar uso móvil.

El técnico puede:

- ver servicios asignados
- iniciar servicio
- tomar notas
- subir fotos
- modificar método de pago
- adjuntar soporte de pago si aplica
- marcar servicio como completado

El técnico no debe acceder a funciones administrativas salvo que también tenga rol admin.

---

## 16. Calendario

Debe existir vista de calendario mensual para servicios.

El calendario debe mostrar servicios del mes.

Al seleccionar un día, se deben poder ver y editar los servicios de ese día.

La edición debe respetar reglas de permisos, estados y disponibilidad de técnicos.

---

## 17. Dashboard administrativo

El dashboard administrativo debe mostrar información global del negocio, como:

- ventas del mes
- servicios realizados
- servicios pendientes
- clientes activos
- próximos servicios
- servicios cancelados o reprogramados

Las métricas financieras deben basarse en servicios registrados con precio histórico.

---

## 18. Configuración administrativa

El panel administrativo debe permitir gestionar:

- nombre de la empresa
- logo
- frecuencia por defecto entre fumigaciones principales
- días por defecto para refuerzos
- si los refuerzos están habilitados por defecto
- si los refuerzos son pagos por defecto
- métodos de pago
- precio global por metro cuadrado, si se implementa como default

Los cambios de configuración global no deben modificar servicios históricos.

---

## 19. Historial

Cada sucursal debe tener historial de fumigaciones.

El historial debe incluir:

- fecha programada
- fecha realizada, si se registra
- tipo de servicio
- estado
- técnicos asignados
- notas
- evidencias
- método de pago
- soporte de pago
- precio histórico

---

## 20. Auditoría

El sistema debe registrar eventos importantes en `activity_logs`.

Eventos recomendados:

- creación de usuario
- creación de cliente
- creación de servicio
- cambio de estado de servicio
- reprogramación
- cancelación
- cambio de configuración
- subida de evidencias

Los logs no deben bloquear la operación principal si fallan, salvo en acciones críticas que se definan después.

---

## 21. Base de datos

Toda modificación de base de datos debe cumplir:

1. crear un script SQL nuevo en `/Scripts`
2. actualizar `init.sql`
3. documentar el cambio si introduce reglas nuevas

No se permite modificar la estructura de base de datos sin script de migración.

---

## 22. Frontend

El frontend debe ser:

- minimalista
- moderno
- limpio
- responsive
- optimizado para mobile en vistas de técnico

Debe usar componentes reutilizables siempre que sea posible:

- botones
- inputs
- selects
- multiselects
- modales
- tablas
- toasts

Debe evitarse duplicar lógica visual.

---

## 23. Estado frontend

El frontend usará Pinia para manejo de estado.

Se permiten cambios optimistas cuando mejoren la experiencia, siempre que:

- se pueda revertir si falla la API
- se muestre feedback al usuario
- no se oculte un error importante

---

## 24. Helpers y composables

Deben reutilizarse helpers y composables para:

- fechas
- monedas
- llamadas API
- autenticación
- toasts
- links de WhatsApp
- formato de teléfono
- manejo de archivos o imágenes cuando aplique

No crear helpers genéricos sin uso real.

---

## 25. Diseño visual

La interfaz debe soportar modo claro y modo oscuro.

Tailwind debe trabajar con variables CSS para colores reutilizables.

El diseño debe priorizar:

- bordes redondeados
- iconos discretos
- buen espaciado
- pocas distracciones
- acciones claras

---

## 26. Backend

El backend debe usar Clean Architecture.

Capas:

- domain
- application
- infrastructure
- interfaces

Reglas:

- controllers solo manejan request/response
- casos de uso orquestan reglas
- entidades y servicios de dominio contienen reglas puras
- repositorios abstraen la persistencia
- no debe haber lógica SQL en controllers
- no debe haber lógica de negocio en rutas

---

## 27. Seguridad

Las contraseñas deben almacenarse hasheadas.

Nunca guardar passwords en texto plano en producción.

Los tokens deben manejarse mediante variables de entorno seguras.

Los endpoints administrativos deben validar permisos.

Los endpoints técnicos deben validar que el usuario esté asignado al servicio cuando corresponda.

---

## 28. Archivos e imágenes

Las imágenes deben subirse a Firebase Storage.

La API debe guardar únicamente URL o metadata necesaria.

No guardar archivos binarios en PostgreSQL.

---

## 29. Precios

Cada sucursal puede tener precio fijo o precio por metro cuadrado.

El precio final de un servicio debe guardarse en el registro del servicio.

Una vez creado o completado un servicio, su precio histórico no debe depender de cambios futuros en configuración.

---

## 30. Principio general

El sistema debe resolver primero el flujo real del negocio.

Se debe evitar:

- sobreingeniería
- abstracciones sin uso
- módulos no solicitados
- duplicar reglas
- crear código que no se vaya a utilizar pronto

Ante duda, preferir la implementación simple, explícita y fácil de mantener.

---

## 31. Tokens y recuperacion de contrasena

Los refresh tokens y tokens de recuperacion deben persistirse en base de datos.

Nunca deben guardarse tokens en texto plano; solo hashes.

El login debe devolver access token de corta duracion y refresh token de mayor duracion.

El flujo de refresh debe rotar el refresh token anterior.

Logout debe revocar el refresh token recibido.

El cambio de contrasena autenticado debe requerir contrasena actual valida.

El flujo de recuperacion de contrasena no debe revelar si el email existe o no.

Los tokens de recuperacion deben ser de un solo uso y expirar.

## 32. Atribucion de ventas por tecnico

Cada sucursal define 	echnician_revenue_mode para atribucion de ventas con valores permitidos split y ull.

Reglas:
- sales representa ventas reales del negocio y cuenta cada servicio una sola vez.
- ttributedSales representa ventas atribuidas a tecnicos y puede superar sales cuando el modo es ull.
- En modo split, el valor del servicio se divide entre tecnicos asignados.
- En modo ull, cada tecnico asignado recibe el valor completo del servicio.
- La atribucion usa services.price historico y no recalcula precios historicos.


## 33. Dashboard hardening

Reglas de completionRate:
- Sin dimension ni groupBy: tasa global.
- Con groupBy: tasa por periodo usando denominador del mismo periodo.
- Con dimension solo se permite: technician, client, business, branch.

Reglas de alertas:
- overdueServices debe respetar filtros: from, to, technicianId, clientId, businessId, branchId.
- overdueCycles debe respetar filtros: branchId, businessId, clientId.
- pendingReinforcements debe respetar filtros: from, to, branchId, businessId, clientId, technicianId cuando aplique.
- transfersWithoutProof debe respetar filtros: from, to, technicianId, clientId, businessId, branchId.
- completedWithoutEvidence debe respetar filtros: from, to, technicianId, clientId, businessId, branchId.

Nota de trazabilidad:
- Actualmente attributedSales usa technicianRevenueMode actual de la sucursal.
- Si se requiere trazabilidad historica exacta, se debe guardar snapshot en services o service_technicians.
