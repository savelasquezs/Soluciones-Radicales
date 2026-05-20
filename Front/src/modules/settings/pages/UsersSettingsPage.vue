<template>
	<main class="users-page">
		<header class="users-header">
			<p class="users-eyebrow">Settings / Usuarios</p>
			<h1>Usuarios y técnicos</h1>
		</header>

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

		<section class="users-table-section" aria-labelledby="users-table-title">
			<div class="table-toolbar">
				<button
					type="button"
					class="button button-primary button-small"
					@click="openCreateModal"
				>
					Crear usuario
				</button>
			</div>

			<p v-if="successMessage" class="feedback feedback-success" role="status">
				{{ successMessage }}
			</p>
			<p
				v-if="errorMessage && !isFormModalOpen"
				class="feedback feedback-error"
				role="alert"
			>
				{{ errorMessage }}
			</p>

			<div v-if="loading" class="state-box">
				Cargando usuarios disponibles...
			</div>
			<div
				v-else-if="errorMessage && !users.length"
				class="state-box state-error"
			>
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
								<span class="badge badge-role">{{
									formatRole(user.role)
								}}</span>
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
												: deleteActionLabel
										}}
									</button>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</div>
		</section>

		<section
			v-if="isFormModalOpen"
			class="users-modal-overlay"
			role="dialog"
			aria-modal="true"
			aria-labelledby="user-form-title"
			@click.self="cancelEdit"
		>
			<article class="users-modal">
				<header class="modal-header">
					<h2 id="user-form-title">
						{{ isEditing ? 'Editar usuario' : 'Crear usuario' }}
					</h2>
					<button type="button" class="modal-close" @click="cancelEdit">
						×
					</button>
				</header>
				<p class="modal-description">
					La persistencia ocurre en backend mediante
					<strong>usersService</strong>.
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
								<small v-if="fieldErrors.name" class="field-error">{{
									fieldErrors.name
								}}</small>
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
								<small v-if="fieldErrors.email" class="field-error">{{
									fieldErrors.email
								}}</small>
							</div>

							<div class="form-group">
								<label for="user-password">Password</label>
								<div class="password-field">
									<input
										id="user-password"
										v-model="form.password"
										:type="showPassword ? 'text' : 'password'"
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
									<button
										type="button"
										class="password-toggle"
										:disabled="isEditing"
										@click="togglePasswordVisibility"
									>
										{{ showPassword ? 'Ocultar' : 'Ver' }}
									</button>
								</div>
								<small v-if="fieldErrors.password" class="field-error">
									{{ fieldErrors.password }}
								</small>
							</div>

							<div class="form-group">
								<label for="user-role">Rol</label>
								<select
									id="user-role"
									v-model="form.role"
									name="role"
									@change="handleRoleChange"
								>
									<option value="">Selecciona un rol</option>
									<option value="technician">Técnico</option>
									<option value="admin">Administrador</option>
								</select>
								<small v-if="fieldErrors.role" class="field-error">{{
									fieldErrors.role
								}}</small>
							</div>
						</div>

						<div v-if="showAdminTechnicianToggle" class="checkbox-row">
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
							<button
								type="submit"
								class="button button-primary"
								:disabled="saving"
							>
								{{
									saving
										? 'Guardando...'
										: isEditing
											? 'Guardar cambios'
											: 'Crear usuario'
								}}
							</button>
							<button
								type="button"
								class="button button-secondary"
								@click="cancelEdit"
							>
								Cancelar edición
							</button>
						</div>
					</fieldset>
				</form>
			</article>
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
	role: '' | 'admin' | 'technician';
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
const canDelete = true;
const deleteActionLabel = 'Desactivar';
const isFormModalOpen = ref(false);
const showPassword = ref(false);

const form = reactive<UserForm>({
	id: '',
	name: '',
	email: '',
	password: '',
	role: 'technician',
	isTechnician: true,
});

const isEditing = computed(() => Boolean(form.id));
const techniciansCount = computed(
	() => users.value.filter((user) => user.isTechnician).length,
);
const adminsCount = computed(
	() => users.value.filter((user) => user.role === 'admin').length,
);
const showAdminTechnicianToggle = computed(() => form.role === 'admin');

const normalizeUsers = (availableUsers: User[]) => {
	return [...availableUsers].sort((left, right) =>
		left.name.localeCompare(right.name),
	);
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
		const availableUsers = await usersService.listUsers();
		users.value = normalizeUsers(availableUsers);
	} catch (error) {
		errorMessage.value =
			error instanceof Error ? error.message : 'No se pudo cargar la lista.';
		users.value = [];
	} finally {
		loading.value = false;
	}
};

const resetFeedback = () => {
	errorMessage.value = '';
	successMessage.value = '';
};

const openCreateModal = () => {
	resetFeedback();
	resetForm();
	showPassword.value = false;
	isFormModalOpen.value = true;
};

// Restablece el formulario para volver al modo creación.
const resetForm = () => {
	form.id = '';
	form.name = '';
	form.email = '';
	form.password = '';
	form.role = 'technician';
	form.isTechnician = true;
	showPassword.value = false;
	fieldErrors.value = {};
};

const handleRoleChange = () => {
	if (form.role === 'technician') {
		form.isTechnician = true;
		return;
	}

	if (form.role === 'admin') {
		form.isTechnician = false;
	}
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
	const isTechnician = form.role === 'technician' ? true : form.isTechnician;
	const payload: CreateUserPayload = {
		name: form.name,
		email: form.email,
		password: form.password,
		role: 'admin',
		isTechnician,
	};
	await usersService.createUser(payload);
	await refreshAfterMutation('Usuario creado correctamente.');
};

const updateUser = async () => {
	const isTechnician = form.role === 'technician' ? true : form.isTechnician;
	const payload: UpdateUserPayload = {
		name: form.name,
		email: form.email,
		isTechnician,
	};
	await usersService.updateUser(form.id, payload);
	await refreshAfterMutation('Usuario actualizado correctamente.');
};

// @submit.prevent evita la recarga completa de la página.
const handleSubmit = async () => {
	resetFeedback();
	if (!validateForm()) {
		return;
	}
	saving.value = true;
	try {
		if (form.id) {
			await updateUser();
			isFormModalOpen.value = false;
			return;
		}
		await createUser();
		isFormModalOpen.value = false;
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
	isFormModalOpen.value = true;
	form.id = user.id;
	form.name = user.name;
	form.email = user.email;
	form.password = '';
	showPassword.value = false;
	form.role = user.isTechnician ? 'technician' : 'admin';
	form.isTechnician = user.isTechnician;
};

const cancelEdit = () => {
	resetFeedback();
	resetForm();
	isFormModalOpen.value = false;
};

const togglePasswordVisibility = () => {
	showPassword.value = !showPassword.value;
};

const deleteOrDisableUser = async (user: User) => {
	if (!user.id) {
		errorMessage.value = 'No se encontró el usuario a desactivar.';
		return;
	}
	await usersService.disableUser(user.id, authStore.user?.id);
	await refreshAfterMutation('Usuario desactivado correctamente.');
};

const confirmDelete = async (user: User) => {
	if (!canDelete) {
		await deleteOrDisableUser(user);
		return;
	}
	if (
		!window.confirm(
			`¿Deseas ${deleteActionLabel.toLowerCase()} a ${user.name}?`,
		)
	) {
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
.users-page {
	--users-surface: hsl(var(--card));
	--users-border: hsl(var(--border));
	--users-text: hsl(var(--foreground));
	--users-muted: hsl(var(--foreground) / 0.72);
	--users-primary: hsl(var(--primary));
	--users-danger: hsl(var(--danger));
	--users-success: hsl(var(--primary));
	--users-shadow: 0 10px 24px hsl(var(--foreground) / 0.08);
	display: grid;
	gap: 0.9rem;
	color: var(--users-text);
}

.users-header,
.users-academic,
.summary-card,
.users-table-section {
	background: var(--users-surface);
	border: 1px solid var(--users-border);
	border-radius: 1rem;
	box-shadow: var(--users-shadow);
}

.users-header {
	padding: 1.2rem;
}

.users-eyebrow {
	margin: 0 0 0.5rem;
	color: var(--users-primary);
	font-size: 0.74rem;
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
	font-size: clamp(1.6rem, 2.8vw, 2rem);
	line-height: 1.05;
}

.users-description,
.section-heading p,
.contract-notice,
.summary-card h3 {
	color: var(--users-muted);
}

.users-description {
	max-width: 60rem;
	margin: 0.55rem 0 0;
	line-height: 1.45;
	font-size: 0.9rem;
}

.users-academic {
	padding: 1rem 1.2rem;
}

.users-academic h2,
.users-summary h2 {
	font-size: 1.02rem;
}

.academic-list {
	margin: 0.7rem 0 0;
	padding-left: 1rem;
	line-height: 1.55;
	font-size: 0.9rem;
}

.contract-notice {
	margin: 0.7rem 0 0;
	padding: 0.7rem 0.85rem;
	border-radius: 0.7rem;
	background: hsl(var(--primary) / 0.1);
	font-size: 0.88rem;
}

.users-summary {
	display: grid;
	gap: 0.6rem;
}

.summary-grid {
	display: grid;
	gap: 0.65rem;
	grid-template-columns: repeat(3, minmax(0, 1fr));
}

.summary-card {
	padding: 0.9rem;
}

.summary-card p {
	margin: 0.4rem 0 0;
	font-size: 1.55rem;
	font-weight: 700;
}

.users-table-section {
	padding: 1rem;
}

.section-heading {
	margin-bottom: 0.65rem;
}

.section-heading h2 {
	font-size: 1.06rem;
}

.section-heading p {
	font-size: 0.9rem;
}

.table-toolbar {
	margin: 0 0 0.65rem;
}

.users-form {
	display: grid;
}

.form-fieldset {
	margin: 0;
	padding: 0.9rem;
	border: 1px solid var(--users-border);
	border-radius: 0.9rem;
}

.form-fieldset legend {
	padding: 0 0.4rem;
	font-size: 0.9rem;
	font-weight: 700;
}

.form-grid {
	display: grid;
	gap: 0.7rem;
}

.form-group {
	display: grid;
	gap: 0.35rem;
}

.form-group label,
.checkbox-label {
	font-size: 0.86rem;
	font-weight: 600;
}

.form-group input,
.form-group select {
	width: 100%;
	padding: 0.58rem 0.75rem;
	font-size: 0.9rem;
	color: inherit;
	background: transparent;
	border: 1px solid var(--users-border);
	border-radius: 0.75rem;
	transition:
		border-color 0.2s ease,
		box-shadow 0.2s ease;
}

.password-field {
	position: relative;
}

.password-field input {
	padding-right: 3.9rem;
}

.password-toggle {
	position: absolute;
	top: 50%;
	right: 0.38rem;
	transform: translateY(-50%);
	border: 1px solid var(--users-border);
	border-radius: 999px;
	padding: 0.18rem 0.52rem;
	background: hsl(var(--muted));
	color: var(--users-text);
	font-size: 0.75rem;
	cursor: pointer;
}

.password-toggle:disabled {
	opacity: 0.55;
	cursor: not-allowed;
}

.form-group select {
	color-scheme: light;
	background-color: hsl(var(--card));
}

.form-group select option {
	color: hsl(var(--foreground));
	background-color: hsl(var(--card));
}

.form-group select option:checked {
	color: hsl(var(--foreground));
	background-color: hsl(var(--primary) / 0.25);
}

:global(.dark) .form-group select {
	color-scheme: dark;
}

.form-group input:focus,
.form-group select:focus {
	outline: none;
	border-color: var(--users-primary);
	box-shadow: 0 0 0 3px hsl(var(--primary) / 0.18);
}

.checkbox-row {
	display: grid;
	gap: 0.45rem;
	margin-top: 0.75rem;
}

.checkbox-label {
	display: inline-flex;
	gap: 0.55rem;
	align-items: center;
}

.checkbox-label input {
	width: 0.95rem;
	height: 0.95rem;
}

.form-actions,
.action-row {
	display: flex;
	gap: 0.55rem;
	flex-wrap: wrap;
}

.form-actions {
	margin-top: 0.85rem;
}

.table-wrapper {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
}

thead th {
	padding: 0.7rem 0.8rem;
	font-size: 0.72rem;
	font-weight: 700;
	text-transform: uppercase;
	letter-spacing: 0.08em;
	text-align: left;
	color: var(--users-muted);
	border-bottom: 1px solid var(--users-border);
}

tbody td {
	padding: 0.72rem 0.8rem;
	border-bottom: 1px solid var(--users-border);
	vertical-align: top;
	font-size: 0.92rem;
}

tbody tr:last-child td {
	border-bottom: none;
}

.badge {
	display: inline-flex;
	align-items: center;
	justify-content: center;
	padding: 0.28rem 0.58rem;
	border-radius: 999px;
	font-size: 0.7rem;
	font-weight: 700;
}

.badge-role,
.badge-muted {
	background: hsl(var(--muted));
}

.badge-success {
	color: var(--users-success);
	background: hsl(var(--primary) / 0.12);
}

.button {
	border: none;
	border-radius: 999px;
	padding: 0.58rem 0.9rem;
	font: inherit;
	font-size: 0.86rem;
	font-weight: 700;
	cursor: pointer;
	transition:
		transform 0.15s ease,
		opacity 0.2s ease;
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
	background: hsl(var(--muted));
}

.button-danger {
	color: white;
	background: var(--users-danger);
}

.button-small {
	padding: 0.5rem 0.82rem;
	font-size: 0.8rem;
}

.feedback,
.state-box {
	padding: 0.62rem 0.8rem;
	border-radius: 0.7rem;
	font-size: 0.88rem;
}

.feedback {
	margin: 0 0 0.7rem;
}

.feedback-success {
	color: var(--users-success);
	background: hsl(var(--primary) / 0.14);
}

.feedback-error,
.state-error,
.field-error {
	color: var(--users-danger);
}

.feedback-error,
.state-error {
	background: hsl(var(--danger) / 0.12);
}

.field-error {
	font-size: 0.76rem;
}

.state-box {
	color: var(--users-muted);
	background: hsl(var(--muted));
}

.users-modal-overlay {
	position: fixed;
	inset: 0;
	z-index: 40;
	display: grid;
	place-items: center;
	padding: 0.9rem;
	background: hsl(var(--foreground) / 0.5);
	backdrop-filter: blur(2px);
}

.users-modal {
	width: min(540px, 100%);
	max-height: 88vh;
	overflow: auto;
	padding: 0.95rem;
	border: 1px solid var(--users-border);
	border-radius: 0.95rem;
	background: var(--users-surface);
	box-shadow: 0 24px 48px hsl(var(--foreground) / 0.24);
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 0.6rem;
	margin-bottom: 0.5rem;
}

.modal-header h2 {
	margin: 0;
	font-size: 1.04rem;
}

.modal-close {
	width: 1.85rem;
	height: 1.85rem;
	border: 1px solid var(--users-border);
	border-radius: 999px;
	background: hsl(var(--muted));
	color: var(--users-text);
	cursor: pointer;
}

.modal-description {
	margin: 0 0 0.65rem;
	color: var(--users-muted);
	font-size: 0.86rem;
}

@media (max-width: 960px) {
	.summary-grid {
		grid-template-columns: 1fr;
	}
}

@media (max-width: 640px) {
	.users-header,
	.users-academic,
	.users-table-section,
	.summary-card {
		padding: 0.85rem;
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
</style>

