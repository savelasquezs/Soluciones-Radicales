<template>
	<div class="space-y-4">
		<div
			v-if="loading"
			class="flex items-center gap-3 rounded-2xl border border-border bg-card p-6 text-sm text-foreground/70"
		>
			<AppSpinner />
			<span>Cargando métodos de pago...</span>
		</div>

		<AppCard
			v-else-if="methods.length === 0"
			class="text-center text-sm text-foreground/70"
		>
			No hay métodos de pago activos. Crea uno para comenzar.
		</AppCard>

		<div v-else class="overflow-x-auto">
			<AppTable>
				<thead
					class="bg-muted text-left text-xs uppercase tracking-[0.15em] text-foreground/70"
				>
					<tr>
						<th class="px-4 py-3">Nombre</th>
						<th class="px-4 py-3">Tipo</th>
						<th class="px-4 py-3">Estado</th>
						<th class="px-4 py-3">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					<tr
						v-for="method in methods"
						:key="method.id"
						class="hover:bg-surface"
					>
						<td class="px-4 py-4">{{ method.name }}</td>
						<td class="px-4 py-4">{{ typeLabel(method.type) }}</td>
						<td class="px-4 py-4">
							<AppBadge tone="success">Activo</AppBadge>
						</td>
						<td class="px-4 py-4 space-x-2">
							<AppButton
								variant="secondary"
								type="button"
								@click="$emit('edit', method)"
								>Editar</AppButton
							>
							<AppButton type="button" @click="$emit('disable', method)"
								>Desactivar</AppButton
							>
						</td>
					</tr>
				</tbody>
			</AppTable>
		</div>
	</div>
</template>

<script setup lang="ts">
import AppBadge from '@/shared/components/ui/AppBadge.vue';
import AppButton from '@/shared/components/ui/AppButton.vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import AppTable from '@/shared/components/ui/AppTable.vue';
import AppSpinner from '@/shared/components/ui/AppSpinner.vue';
import type { PaymentMethod } from '../types/settings.types';

const props = defineProps<{
	methods: PaymentMethod[];
	loading?: boolean;
}>();

const typeLabels: Record<string, string> = {
	cash: 'Efectivo',
	bank: 'Banco',
	transfer: 'Transferencia',
	card: 'Tarjeta',
	other: 'Otro',
};

const typeLabel = (type: string) => typeLabels[type] ?? type;
</script>
