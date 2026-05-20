<template>
	<AppCard class="space-y-3 services-calendar-card">
		<FullCalendar :options="calendarOptions" />
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
	expandRows: true,
	slotDuration: '02:00:00',
	slotLabelInterval: '02:00:00',
	eventTimeFormat: {
		hour: 'numeric' as const,
		minute: '2-digit' as const,
		meridiem: 'short' as const,
	},
	height: '100%',
	events: props.services.map((service) => ({
		id: service.id,
		title:
			service.businessName ||
			service.branchName ||
			service.branchAddress ||
			'Servicio',
		start: service.scheduledAt,
		extendedProps: {
			address: service.branchAddress || '',
			technicians:
				service.technicians?.map((item) => item.name || item.id).join(', ') ||
				'',
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
	height: 100%;
	font-size: 11px;
}

.services-calendar-card :deep(.fc .fc-scrollgrid) {
	height: 100%;
}

.services-calendar-card :deep(.fc .fc-view-harness) {
	height: 100% !important;
}

.services-calendar-card :deep(.fc .fc-daygrid-body) {
	width: 100% !important;
	height: 100% !important;
}

.services-calendar-card :deep(.fc .fc-scrollgrid-sync-table) {
	width: 100% !important;
	height: 100% !important;
}

.services-calendar-card :deep(.fc .fc-toolbar-title) {
	font-size: 1rem;
	color: hsl(var(--foreground));
}

.services-calendar-card :deep(.fc .fc-daygrid-day-number) {
	color: hsl(var(--foreground));
	font-size: 0.85rem;
}

.services-calendar-card :deep(.fc .fc-col-header-cell) {
	background-color: hsl(var(--muted));
	border-color: hsl(var(--border));
}

.services-calendar-card :deep(.fc .fc-col-header-cell-cushion) {
	color: hsl(var(--foreground));
	font-size: 0.78rem;
	font-weight: 700;
	opacity: 1;
}

.services-calendar-card :deep(.fc .fc-button) {
	font-size: 0.75rem;
	padding: 0.25rem 0.5rem;
}

.services-calendar-card :deep(.fc .fc-timegrid-slot) {
	border-color: hsl(var(--border) / 0.28);
}

.services-calendar-card :deep(.fc .fc-timegrid-slot-minor) {
	border-color: transparent;
}

.services-calendar-card :deep(.fc .fc-timegrid-col),
.services-calendar-card :deep(.fc .fc-timegrid-axis),
.services-calendar-card :deep(.fc .fc-timegrid-divider) {
	border-color: hsl(var(--border) / 0.35);
}

.services-calendar-card :deep(.services-calendar-event .fc-event-title) {
	font-size: 10px;
	font-weight: 500;
}

.services-calendar-card :deep(.services-calendar-event .fc-event-time) {
	font-size: 10px;
}
</style>
