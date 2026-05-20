<template>
	<div class="space-y-6">
		<div>
			<h1 class="text-2xl font-semibold text-foreground">Configuración</h1>
			<p class="mt-2 max-w-2xl text-sm text-foreground/70">
				Administra la identidad del negocio, métodos de pago activos y otros
				ajustes importantes.
			</p>
		</div>

		<div class="grid gap-4 md:grid-cols-3">
			<SettingsCard
				title="Empresa"
				description="Edita el nombre del negocio, logo y valores operativos por defecto."
				to="/settings/company"
			/>
			<SettingsCard
				title="Métodos de pago"
				description="Configura los métodos activos disponibles para registrar cobros."
				to="/settings/payment-methods"
			/>
			<SettingsCard
				title="Usuarios y técnicos"
				description="Gestión de usuarios y técnicos estará disponible en la siguiente fase."
				disabled
				badge="Próximamente"
			/>
		</div>
	</div>
</template>

<script setup lang="ts">
import SettingsCard from '../components/SettingsCard.vue';
</script>
