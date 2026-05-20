<template>
  <AppCard v-if="service" class="space-y-4">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-xl font-semibold text-foreground">Detalle del servicio</h2>
        <p class="text-sm text-foreground/70">{{ formatDateTime(service.scheduledAt) }}</p>
      </div>
      <ServiceStatusBadge :status="service.status" />
    </div>

    <div class="grid gap-3 sm:grid-cols-2">
      <p class="text-sm text-foreground/80">Tipo: {{ service.type }}</p>
      <p class="text-sm text-foreground/80">Precio: {{ service.price ?? 'Sin valor' }}</p>
      <p class="text-sm text-foreground/80">
        Sucursal: {{ service.branchAddress || service.branchName || 'No disponible' }}
      </p>
      <p class="text-sm text-foreground/80">
        Negocio: {{ service.businessName || 'No disponible' }}
      </p>
      <p class="text-sm text-foreground/80">Técnico asignado: {{ assignedTechnicians }}</p>
      <p class="text-sm text-foreground/80">
        Teléfono sucursal: {{ service.branchPhone || 'No disponible' }}
      </p>
      <p class="text-sm text-foreground/80">
        Método de pago: {{ service.paymentMethodName || 'No definido' }}
      </p>
      <p class="text-sm text-foreground/80">
        Soporte de pago: {{ service.paymentProofUrl ? 'Disponible' : 'No disponible' }}
      </p>
      <p class="text-sm text-foreground/80">ID servicio: {{ service.id }}</p>
    </div>

    <div>
      <p class="text-sm font-medium text-foreground">Notas</p>
      <p class="text-sm text-foreground/70">{{ service.notes || 'Sin notas' }}</p>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import { formatDateTime } from '@/shared/helpers/dates';
import type { Service } from '../types/services.types';
import ServiceStatusBadge from './ServiceStatusBadge.vue';

const props = defineProps<{
  service: Service | null;
}>();

const assignedTechnicians = computed(() => {
  const technicians = props.service?.technicians ?? [];
  if (!technicians.length) {
    return 'Sin técnico';
  }

  const names = technicians
    .map((technician) => technician.name?.trim())
    .filter((name): name is string => Boolean(name));

  return names.length ? names.join(', ') : 'Técnico asignado';
});
</script>
