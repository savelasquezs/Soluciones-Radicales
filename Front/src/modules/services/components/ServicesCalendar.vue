<template>
  <AppCard class="space-y-3">
    <FullCalendar :options="calendarOptions" />
  </AppCard>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { computed } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import type { Service } from '../types/services.types';

const props = defineProps<{
  services: Service[];
}>();

const emit = defineEmits<{
  'select-date': [date: string];
  'select-service': [serviceId: string];
  'change-month': [payload: { year: number; month: number }];
}>();

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  height: 'auto',
  events: props.services.map((service) => ({
    id: service.id,
    title: service.businessName || service.branchName || service.branchAddress || `Sucursal ${service.branchId}`,
    start: service.scheduledAt,
  })),
  dateClick: (arg: { dateStr: string }) => {
    emit('select-date', arg.dateStr);
  },
  eventClick: (arg: { event: { id: string } }) => {
    emit('select-service', arg.event.id);
  },
  datesSet: (arg: { start: Date }) => {
    emit('change-month', { year: arg.start.getFullYear(), month: arg.start.getMonth() + 1 });
  },
}));
</script>
