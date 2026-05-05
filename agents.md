# 🧠 AGENTS.md — Reglas de trabajo para agentes (Codex / AI)

Este archivo define cómo deben trabajar los agentes dentro de este repositorio.
El objetivo es mantener **consistencia, calidad y evitar código innecesario**.

---

# 🎯 PRINCIPIOS GENERALES

- Priorizar **simplicidad y claridad**
- No generar código innecesario
- Mantener **modularidad y reutilización**
- Seguir arquitectura definida (backend + frontend)
- Antes de actuar, **entender el dominio**

---

# 📚 FUENTE DE VERDAD

Antes de hacer cualquier cambio, SIEMPRE:

1. Leer:
   - `business-rules.md`
   - `init.sql`

2. Validar:
   - Que el cambio respete las reglas actuales
   - Que no rompa lógica existente

---

# 🧾 REGLAS SOBRE BASE DE DATOS

## ⚠️ NUNCA modificar directamente la base de datos sin control

Si necesitas cambiar la base de datos:

### ✅ OBLIGATORIO:

1. Crear un nuevo archivo en:

```
/Scripts
```

2. Nombre del archivo:

```
YYYYMMDD_descripcion_cambio.sql
```

Ejemplo:

```
20260504_add_payment_status.sql
```

---

### ✅ El script debe incluir:

- ALTER TABLE / CREATE TABLE / DROP / etc.
- Datos necesarios de migración (si aplica)
- Comentarios explicando el cambio

---

### ✅ Además:

- Debes actualizar también:

```
init.sql
```

Para que represente el estado más reciente de la base de datos.

---

### ❌ PROHIBIDO:

- Editar tablas sin crear script
- Hacer cambios “silenciosos”
- Duplicar estructuras

---

# 🧠 REGLAS DE NEGOCIO

Antes de implementar cualquier feature:

## ✅ OBLIGATORIO:

1. Revisar:

```
business-rules.md
```

2. Validar si:

- Ya existe una regla relacionada
- El cambio la afecta

---

## 🆕 Si introduces nueva lógica:

Debes:

- Agregarla a `business-rules.md`
- Explicarla de forma clara
- Mantener consistencia con reglas existentes

---

# 🏗️ BACKEND

## Stack:

- Node.js
- Express
- Clean Architecture

---

## 📂 Estructura obligatoria:

```
domain/
application/
infrastructure/
interfaces/
```

---

## 📌 Reglas:

- No mezclar capas
- La lógica de negocio vive en `domain` o `application`
- Controllers solo manejan request/response
- No lógica en rutas

---

## 🔐 Autenticación

- JWT + Refresh Token
- Roles simples:
  - admin

- Flag:
  - isTechnician

---

## ⚠️ IMPORTANTE:

- Validar disponibilidad de técnicos antes de asignar servicios
- No recalcular precios históricos
- No asumir valores: siempre respetar configuración

---

# 🎨 FRONTEND

## Stack:

- Vue 3
- Script Setup
- TypeScript
- Pinia
- Tailwind

---

## 📂 Estructura:

```
components/
modules/
composables/
stores/
services/
utils/
```

---

## 🧩 COMPONENTES

Crear y reutilizar:

- BaseButton
- BaseInput
- BaseSelect
- BaseModal
- BaseTable
- BaseToast

---

## 🔁 COMPOSABLES

- useAuth
- useApi
- useToast
- useDate
- useCurrency
- useWhatsapp

---

## 🎯 DISEÑO

- Minimalista
- Moderno
- Espaciado limpio
- Bordes redondeados
- Uso de iconos

---

## 🌗 THEMING

- Soporte dark / light mode
- Usar variables CSS con Tailwind

---

## ⚡ UX

- Formularios simples (evitar múltiples pasos innecesarios)
- Acciones rápidas:
  - contactar por WhatsApp
  - reprogramar
  - descartar

---

# 📲 WHATSAPP

- Usar links tipo:

```
https://wa.me/
```

- Mensajes dinámicos con:
  - nombre cliente
  - empresa
  - fecha próxima

---

# 🔄 SERVICIOS (LÓGICA CLAVE)

- Tipos:
  - main
  - reinforcement

---

## Reglas:

- Un servicio principal puede generar refuerzo
- Fechas dependen de:
  - configuración global
  - configuración de sucursal

---

# 📦 DATOS IMPORTANTES

- system_settings → configuración global
- branches → configuración específica
- services → historial real (NO recalcular)
- service_cycles → próximas fechas

---

# 🚫 ANTI-PATTERNS (PROHIBIDO)

- Código duplicado
- Lógica en frontend que debe estar en backend
- Crear funciones reutilizables sin necesidad real
- Sobreingeniería

---

# ✅ FORMA DE TRABAJAR

Cuando se te pida algo:

1. Analizar reglas de negocio
2. Ver estructura actual
3. Proponer solución simple
4. Implementar solo lo necesario

---

# 🧠 FILOSOFÍA

Menos código > más código
Claridad > complejidad
Reutilización > repetición

---

Este proyecto debe poder escalar sin reescribirse.
