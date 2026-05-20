<template>
  <main class="users-page">
    <header class="users-header">
      <p class="users-eyebrow">Settings / Usuarios</p>
      <h1>Usuarios y técnicos</h1>
      <p class="users-description">
        Esta pantalla demuestra un CRUD completo dentro de una SPA usando Vue,
        HTML semántico, CSS scoped y consumo de una API Node.js + Express con
        base de datos real.
      </p>
    </header>

    <section class="users-academic" aria-labelledby="academic-demo-title">
      <h2 id="academic-demo-title">Demostración académica CRUD</h2>
      <ul class="academic-list">
        <li>Crear: formulario conectado al backend.</li>
        <li>Leer: listado cargado desde API.</li>
        <li>Actualizar: modo edición en el mismo formulario.</li>
        <li>
          Eliminar/Desactivar: acción desde la tabla según el contrato
          disponible.
        </li>
        <li>
          La interfaz se actualiza sin recargar toda la página gracias al estado
          reactivo de Vue.
        </li>
      </ul>
      <p class="contract-notice">
        {{ contractNotice }}
      </p>
    </section>

    <section class="users-summary" aria-labelledby="summary-title">
      <h2 id="summary-title">Resumen</h2>
      <div class="summary-grid">
        <article class="summary-card">
          <h3>Total usuarios visibles</h3>
          <p>{{ users.length }}</p>
        </article>
        <article class="summary-card">
          <h3>Total técnicos</h3>
          <p>{{ techniciansCount }}</p>
        </article>
        <article class="summary-card">
          <h3>Total administradores visibles</h3>
          <p>{{ adminsCount }}</p>
        </article>
      </div>
    </section>

    <section class="users-content" aria-label="Gestión de usuarios">
      <section class="users-form-section" aria-labelledby="user-form-title">
        <header class="section-heading">
          <h2 id="user-form-title">
            {{ isEditing ? 'Editar usuario' : 'Crear usuario' }}
          </h2>
          <p>
            La persistencia ocurre en backend mediante
            <strong>usersService</strong>.
          </p>
        </header>

        <p v-if="successMessage" class="feedback feedback-success" role="status">
          {{ successMessage }}
        </p>
        <p v-if="errorMessage" class="feedback feedback-error" role="alert">
          {{ errorMessage }}
        </p>

        <!-- @submit.prevent evita la recarga completa de la página -->
        <form class="users-form" @submit.prevent="handleSubmit">
          <!-- form.id define si el formulario crea o edita -->
          <input v-model="form.id" type="hidden" aria-hidden="true" />

          <fieldset :disabled="saving" class="form-fieldset">
            <legend>Datos del usuario</legend>

            <div class="form-grid">
              <div class="form-group">
                <label for="user-name">Nombre</label>
                <input
                  id="user-name"
                  v-model.trim="form.name"
                  type="text"
                  name="name"
                  autocomplete="name"
                  placeholder="Nombre completo"
                />
                <small v-if="fieldErrors.name" class="field-error">
                  {{ fieldErrors.name }}
                </small>
              </div>

              <div class="form-group">
                <label for="user-email">Email</label>
                <input
                  id="user-email"
                  v-model.trim="form.email"
                  type="email"
                  name="email"
                  autocomplete="email"
                  placeholder="correo@empresa.com"
                />
                <small v-if="fieldErrors.email" class="field-error">
                  {{ fieldErrors.email }}
                </small>
              </div>

              <div class="form-group">
                <label for="user-password">Password</label>
                <input
                  id="user-password"
                  v-model="form.password"
                  type="password"
                  name="password"
                  autocomplete="new-password"
                  :required="!isEditing"
                  :disabled="isEditing"
                  :placeholder="
                    isEditing
                      ? 'No se modifica desde esta pantalla'
                      : 'Mínimo 6 caracteres'
                  "
                />
                <small v-if="fieldErrors.password" class="field-error">
                  {{ fieldErrors.password }}
                </small>
              </div>

              <div class="form-group">
                <label for="user-role">Rol</label>
                <select id="user-role" v-model="form.role" name="role">
                  <option value="">Selecciona un rol</option>
                  <option value="admin">Administrador</option>
                </select>
                <small v-if="fieldErrors.role" class="field-error">
                  {{ fieldErrors.role }}
                </small>
              </div>
            </div>

            <div class="checkbox-row">
              <label class="checkbox-label" for="user-is-technician">
                <input
                  id="user-is-technician"
                  v-model="form.isTechnician"
                  type="checkbox"
                  name="isTechnician"
                />
                <span>Es técnico</span>
              </label>
              <small v-if="fieldErrors.isTechnician" class="field-error">
                {{ fieldErrors.isTechnician }}
              </small>
            </div>

            <div class="form-actions">
              <button type="submit" class="button button-primary" :disabled="saving">
                {{ saving ? 'Guardando...' : isEditing ? 'Guardar cambios' : 'Crear usuario' }}
              </button>
              <button
                v-if="isEditing"
                type="button"
                class="button button-secondary"
                @click="cancelEdit"
              >
                Cancelar edición
              </button>
            </div>
          </fieldset>
        </form>
      </section>

      <section class="users-table-section" aria-labelledby="users-table-title">
        <header class="section-heading">
          <h2 id="users-table-title">Listado</h2>
          <p>
            Después de cada mutación se refresca la lista sin recargar el
            navegador.
          </p>
        </header>

        <div v-if="loading" class="state-box">Cargando usuarios disponibles...</div>
        <div v-else-if="errorMessage && !users.length" class="state-box state-error">
          {{ errorMessage }}
        </div>
        <div v-else-if="!users.length" class="state-box">
          No hay usuarios visibles con el contrato actual.
        </div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th scope="col">Nombre</th>
                <th scope="col">Email</th>
                <th scope="col">Rol</th>
                <th scope="col">Técnico</th>
                <th scope="col">Creado</th>
                <th scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.name }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="badge badge-role">{{ formatRole(user.role) }}</span>
                </td>
                <td>
                  <span
                    class="badge"
                    :class="user.isTechnician ? 'badge-success' : 'badge-muted'"
                  >
                    {{ user.isTechnician ? 'Sí' : 'No' }}
                  </span>
                </td>
                <td>{{ formatCreatedAt(user.createdAt) }}</td>
                <td>
                  <div class="action-row">
                    <button
                      type="button"
                      class="button button-secondary button-small"
                      @click="startEdit(user)"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      class="button button-danger button-small"
                      :disabled="!canDelete || deletingId === user.id"
                      @click="confirmDelete(user)"
                    >
                      {{
                        deletingId === user.id
                          ? 'Procesando...'
                          : canDelete
                            ? deleteActionLabel
                            : `${deleteActionLabel} no disponible`
                      }}
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useAuthStore } from '@/modules/auth/stores/auth.store';
import { usersService } from '@/modules/users/services/users.service';
import type {
  CreateUserPayload,
  UpdateUserPayload,
  User,
} from '@/modules/users/types/users.types';
import { useToast } from '@/shared/composables/useToast';

type UserForm = {
  id: string;
  name: string;
  email: string;
  password: string;
  role: '' | 'admin';
  isTechnician: boolean;
};

type FieldErrors = Partial<Record<keyof UserForm, string>>;

const authStore = useAuthStore();
const { push } = useToast();

const users = ref<User[]>([]);
const loading = ref(false);
const saving = ref(false);
const deletingId = ref<string | null>(null);
const errorMessage = ref('');
const successMessage = ref('');
const fieldErrors = ref<FieldErrors>({});
const canDelete = false;
const deleteActionLabel = 'Desactivar';

const form = reactive<UserForm>({
  id: '',
  name: '',
  email: '',
  password: '',
  role: 'admin',
  isTechnician: false,
});

const isEditing = computed(() => Boolean(form.id));
const techniciansCount = computed(
  () => users.value.filter((user) => user.isTechnician).length,
);
const adminsCount = computed(
  () => users.value.filter((user) => user.role === 'admin').length,
);
const contractNotice = computed(() => {
  return 'El backend actual expone creación, edición, consulta por id y listado de técnicos. No existe todavía un endpoint para listar todos los usuarios ni para desactivar/eliminar usuarios, por lo que esas acciones quedan limitadas a lo disponible.';
});

const normalizeUsers = (technicians: User[]) => {
  const visibleUsers = [...technicians];
  const currentUser = authStore.user;

  if (
    currentUser &&
    !visibleUsers.some((user) => user.id === currentUser.id)
  ) {
    visibleUsers.unshift(currentUser);
  }

  return visibleUsers.sort((left, right) => left.name.localeCompare(right.name));
};

const formatRole = (role: User['role']) => {
  return role === 'admin' ? 'Administrador' : 'Técnico';
};

const formatCreatedAt = (value?: string) => {
  if (!value) {
    return 'Sin dato';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Sin dato';
  }

  return new Intl.DateTimeFormat('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
};

// Carga la lista usando el endpoint disponible y mantiene la SPA reactiva.
const loadUsers = async () => {
  loading.value = true;
  errorMessage.value = '';

  try {
    const technicians = await usersService.listTechnicians();
    users.value = normalizeUsers(technicians);
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'No se pudo cargar la lista.';
    users.value = normalizeUsers([]);
  } finally {
    loading.value = false;
  }
};

const resetFeedback = () => {
  errorMessage.value = '';
  successMessage.value = '';
};

// Restablece el formulario para volver al modo creación.
const resetForm = () => {
  form.id = '';
  form.name = '';
  form.email = '';
  form.password = '';
  form.role = 'admin';
  form.isTechnician = false;
  fieldErrors.value = {};
};

// Valida el formulario antes de persistir datos en backend.
const validateForm = () => {
  const nextErrors: FieldErrors = {};

  if (!form.name) {
    nextErrors.name = 'El nombre es obligatorio.';
  } else if (form.name.length < 3) {
    nextErrors.name = 'El nombre debe tener al menos 3 caracteres.';
  }

  if (!form.email) {
    nextErrors.email = 'El email es obligatorio.';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    nextErrors.email = 'Ingresa un email válido.';
  }

  if (!isEditing.value) {
    if (!form.password) {
      nextErrors.password = 'La contraseña es obligatoria al crear.';
    } else if (form.password.length < 6) {
      nextErrors.password = 'La contraseña debe tener al menos 6 caracteres.';
    }
  }

  if (!form.role) {
    nextErrors.role = 'El rol es obligatorio.';
  }

  if (typeof form.isTechnician !== 'boolean') {
    nextErrors.isTechnician = 'El campo técnico debe ser booleano.';
  }

  fieldErrors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
};

// Después de cada mutación se refresca la lista sin recargar el navegador.
const refreshAfterMutation = async (message: string) => {
  await loadUsers();
  resetForm();
  successMessage.value = message;
  push(message);
};

const createUser = async () => {
  const payload: CreateUserPayload = {
    name: form.name,
    email: form.email,
    password: form.password,
    role: 'admin',
    isTechnician: form.isTechnician,
  };

  await usersService.createUser(payload);
  await refreshAfterMutation('Usuario creado correctamente.');
};

const updateUser = async () => {
  const payload: UpdateUserPayload = {
    name: form.name,
    email: form.email,
    isTechnician: form.isTechnician,
  };

  await usersService.updateUser(form.id, payload);
  await refreshAfterMutation('Usuario actualizado correctamente.');
};

const handleSubmit = async () => {
  resetFeedback();

  if (!validateForm()) {
    return;
  }

  saving.value = true;

  try {
    if (form.id) {
      await updateUser();
      return;
    }

    await createUser();
  } catch (error) {
    errorMessage.value =
      error instanceof Error ? error.message : 'No se pudo guardar el usuario.';
  } finally {
    saving.value = false;
  }
};

// Carga los datos del usuario en el mismo formulario para editar.
const startEdit = (user: User) => {
  resetFeedback();
  fieldErrors.value = {};
  form.id = user.id;
  form.name = user.name;
  form.email = user.email;
  form.password = '';
  form.role = user.role === 'admin' ? 'admin' : '';
  form.isTechnician = user.isTechnician;
};

const cancelEdit = () => {
  resetFeedback();
  resetForm();
};

const deleteOrDisableUser = async (_user: User) => {
  errorMessage.value =
    'El contrato actual no expone endpoint para eliminar o desactivar usuarios.';
};

const confirmDelete = async (user: User) => {
  if (!canDelete) {
    await deleteOrDisableUser(user);
    return;
  }

  if (!window.confirm(`¿Deseas ${deleteActionLabel.toLowerCase()} a ${user.name}?`)) {
    return;
  }

  deletingId.value = user.id;

  try {
    await deleteOrDisableUser(user);
  } finally {
    deletingId.value = null;
  }
};

onMounted(() => {
  loadUsers();
});
</script>

<style scoped>
/* Layout */
.users-page {
  --users-surface: rgb(255 255 255 / 0.88);
  --users-border: rgb(148 163 184 / 0.22);
  --users-text: rgb(15 23 42);
  --users-muted: rgb(71 85 105);
  --users-primary: rgb(12 74 110);
  --users-danger: rgb(185 28 28);
  --users-success: rgb(21 128 61);
  --users-shadow: 0 24px 60px rgb(15 23 42 / 0.08);
  display: grid;
  gap: 1.5rem;
  color: var(--users-text);
}

.users-header,
.users-academic,
.summary-card,
.users-form-section,
.users-table-section {
  background: var(--users-surface);
  border: 1px solid var(--users-border);
  border-radius: 1.5rem;
  box-shadow: var(--users-shadow);
}

/* Header académico */
.users-header {
  padding: 2rem;
}

.users-eyebrow {
  margin: 0 0 0.75rem;
  color: var(--users-primary);
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.users-header h1,
.users-academic h2,
.users-summary h2,
.section-heading h2,
.summary-card h3 {
  margin: 0;
}

.users-header h1 {
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1;
}

.users-description,
.section-heading p,
.contract-notice,
.summary-card h3 {
  color: var(--users-muted);
}

.users-description {
  max-width: 60rem;
  margin: 1rem 0 0;
  line-height: 1.65;
}

.users-academic {
  padding: 1.5rem 2rem;
}

.academic-list {
  margin: 1rem 0 0;
  padding-left: 1.2rem;
  line-height: 1.7;
}

.contract-notice {
  margin: 1rem 0 0;
  padding: 1rem 1.25rem;
  border-radius: 1rem;
  background: rgb(12 74 110 / 0.08);
}

/* Summary cards */
.users-summary {
  display: grid;
  gap: 1rem;
}

.summary-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
  padding: 1.5rem;
}

.summary-card p {
  margin: 0.75rem 0 0;
  font-size: 2rem;
  font-weight: 700;
}

.users-content {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 24rem) minmax(0, 1fr);
}

.users-form-section,
.users-table-section {
  padding: 1.5rem;
}

/* Form */
.section-heading {
  margin-bottom: 1rem;
}

.users-form {
  display: grid;
}

.form-fieldset {
  margin: 0;
  padding: 1.25rem;
  border: 1px solid var(--users-border);
  border-radius: 1.25rem;
}

.form-fieldset legend {
  padding: 0 0.5rem;
  font-weight: 700;
}

.form-grid {
  display: grid;
  gap: 1rem;
}

.form-group {
  display: grid;
  gap: 0.5rem;
}

.form-group label,
.checkbox-label {
  font-weight: 600;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.85rem 1rem;
  color: inherit;
  background: transparent;
  border: 1px solid var(--users-border);
  border-radius: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: var(--users-primary);
  box-shadow: 0 0 0 4px rgb(12 74 110 / 0.12);
}

.checkbox-row {
  display: grid;
  gap: 0.5rem;
  margin-top: 1rem;
}

.checkbox-label {
  display: inline-flex;
  gap: 0.75rem;
  align-items: center;
}

.checkbox-label input {
  width: 1rem;
  height: 1rem;
}

.form-actions,
.action-row {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.form-actions {
  margin-top: 1.25rem;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  padding: 0.9rem 1rem;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  text-align: left;
  color: var(--users-muted);
  border-bottom: 1px solid var(--users-border);
}

tbody td {
  padding: 1rem;
  border-bottom: 1px solid var(--users-border);
  vertical-align: top;
}

tbody tr:last-child td {
  border-bottom: none;
}

/* Badges */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 700;
}

.badge-role,
.badge-muted {
  background: rgb(148 163 184 / 0.15);
}

.badge-success {
  color: var(--users-success);
  background: rgb(21 128 61 / 0.12);
}

/* Buttons */
.button {
  border: none;
  border-radius: 999px;
  padding: 0.85rem 1.25rem;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.2s ease, background 0.2s ease;
}

.button:hover:enabled {
  transform: translateY(-1px);
}

.button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.button-primary {
  color: white;
  background: var(--users-primary);
}

.button-secondary {
  color: var(--users-text);
  background: rgb(148 163 184 / 0.18);
}

.button-danger {
  color: white;
  background: var(--users-danger);
}

.button-small {
  padding: 0.65rem 1rem;
  font-size: 0.88rem;
}

/* Feedback states */
.feedback,
.state-box {
  padding: 0.95rem 1rem;
  border-radius: 1rem;
}

.feedback {
  margin: 0 0 1rem;
}

.feedback-success {
  color: var(--users-success);
  background: rgb(21 128 61 / 0.12);
}

.feedback-error,
.state-error,
.field-error {
  color: var(--users-danger);
}

.feedback-error,
.state-error {
  background: rgb(185 28 28 / 0.1);
}

.field-error {
  font-size: 0.85rem;
}

.state-box {
  color: var(--users-muted);
  background: rgb(148 163 184 / 0.12);
}

/* Responsive */
@media (max-width: 960px) {
  .summary-grid,
  .users-content {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .users-header,
  .users-academic,
  .users-form-section,
  .users-table-section,
  .summary-card {
    padding: 1.25rem;
  }

  .form-actions,
  .action-row {
    flex-direction: column;
  }

  .button,
  .button-small {
    width: 100%;
  }
}

:global(.dark) .users-page {
  --users-surface: rgb(15 23 42 / 0.88);
  --users-border: rgb(148 163 184 / 0.2);
  --users-text: rgb(226 232 240);
  --users-muted: rgb(148 163 184);
  --users-primary: rgb(56 189 248);
  --users-danger: rgb(248 113 113);
  --users-success: rgb(74 222 128);
  --users-shadow: 0 24px 60px rgb(2 6 23 / 0.35);
}
</style>
