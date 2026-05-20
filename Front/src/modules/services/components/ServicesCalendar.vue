<template>
  <AppCard class="space-y-3 services-calendar-card">
    <FullCalendar :options="calendarOptions" />
    <div
      v-if="tooltip.visible"
      class="pointer-events-none fixed z-50 max-w-xs rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground shadow-soft"
      :style="{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }"
    >
      <p class="font-semibold">{{ tooltip.title }}</p>
      <p>{{ tooltip.time }}</p>
      <p v-if="tooltip.address">{{ tooltip.address }}</p>
      <p v-if="tooltip.technicians">Técnicos: {{ tooltip.technicians }}</p>
    </div>
  </AppCard>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { computed, reactive } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import { formatDateTime } from '@/shared/helpers/dates';
import type { Service } from '../types/services.types';

const props = defineProps<{
  services: Service[];
}>();

const emit = defineEmits<{
  'select-date': [date: string];
  'select-service': [serviceId: string];
  'change-month': [payload: { year: number; month: number }];
}>();

const tooltip = reactive({
  visible: false,
  x: 0,
  y: 0,
  title: '',
  time: '',
  address: '',
  technicians: '',
});

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
  locale: esLocale,
  initialView: 'dayGridMonth',
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,timeGridWeek',
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
  },
  dayHeaderFormat: { weekday: 'short' as const },
  dayMaxEvents: true,
  eventTimeFormat: {
    hour: 'numeric' as const,
    minute: '2-digit' as const,
    meridiem: 'short' as const,
  },
  height: 'auto',
  events: props.services.map((service) => ({
    id: service.id,
    title: service.businessName || service.branchName || service.branchAddress || 'Servicio',
    start: service.scheduledAt,
    extendedProps: {
      address: service.branchAddress || '',
      technicians: service.technicians?.map((item) => item.name || item.id).join(', ') || '',
    },
  })),
  eventClassNames: () => ['services-calendar-event'],
  eventDidMount: (info: {
    event: {
      title: string;
      start: Date | null;
      extendedProps: { address?: string; technicians?: string };
    };
    el: HTMLElement;
  }) => {
    const time = info.event.start ? formatDateTime(info.event.start) : '';
    info.el.title = `${info.event.title}\n${time}${info.event.extendedProps.address ? `\n${info.event.extendedProps.address}` : ''}${info.event.extendedProps.technicians ? `\nTécnicos: ${info.event.extendedProps.technicians}` : ''}`;
  },
  eventMouseEnter: (info: {
    jsEvent: MouseEvent;
    event: {
      title: string;
      start: Date | null;
      extendedProps: { address?: string; technicians?: string };
    };
  }) => {
    tooltip.visible = true;
    tooltip.x = info.jsEvent.clientX + 12;
    tooltip.y = info.jsEvent.clientY + 12;
    tooltip.title = info.event.title;
    tooltip.time = info.event.start ? formatDateTime(info.event.start) : '';
    tooltip.address = info.event.extendedProps.address || '';
    tooltip.technicians = info.event.extendedProps.technicians || '';
  },
  eventMouseLeave: () => {
    tooltip.visible = false;
  },
  dateClick: (arg: { dateStr: string }) => {
    emit('select-date', arg.dateStr);
  },
  eventClick: (arg: { event: { id: string } }) => {
    emit('select-service', arg.event.id);
  },
  datesSet: (arg: { view: { currentStart: Date } }) => {
    const visibleMonthStart = arg.view.currentStart;
    emit('change-month', {
      year: visibleMonthStart.getFullYear(),
      month: visibleMonthStart.getMonth() + 1,
    });
  },
}));
</script>

<style scoped>
.services-calendar-card :deep(.fc) {
  font-size: 11px;
}

.services-calendar-card :deep(.fc .fc-toolbar-title) {
  font-size: 1rem;
  color: hsl(var(--color-foreground));
}

.services-calendar-card :deep(.fc .fc-daygrid-day-number) {
  color: hsl(var(--color-foreground));
  font-size: 0.85rem;
}

.services-calendar-card :deep(.fc .fc-col-header-cell-cushion) {
  color: hsl(var(--color-foreground));
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.9;
}

.services-calendar-card :deep(.fc .fc-button) {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.services-calendar-card :deep(.services-calendar-event .fc-event-title) {
  font-size: 10px;
  font-weight: 500;
}

.services-calendar-card :deep(.services-calendar-event .fc-event-time) {
  font-size: 10px;
}
</style>
