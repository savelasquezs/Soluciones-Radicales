<template>
	<AppCard class="space-y-3 services-calendar-card">
		<FullCalendar ref="calendarRef" :options="calendarOptions" />
	</AppCard>
</template>

<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import { reactive, ref, watch } from 'vue';
import AppCard from '@/shared/components/ui/AppCard.vue';
import { formatDateTime } from '@/shared/helpers/dates';
import type { Service } from '../types/services.types';

const props = defineProps<{
	services: Service[];
	initialDate?: string;
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

const calendarRef = ref<InstanceType<typeof FullCalendar> | null>(null);

const getTechnicianInitials = (name: string) => {
	const parts = name.trim().split(/\s+/).filter(Boolean);
	if (!parts.length) return 'T';
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('');
};

const toDateString = (date: Date) => {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
};

const renderEventContent = (info: {
	timeText: string;
	event: {
		title: string;
		extendedProps: {
			techniciansList?: Array<{ id: string; name?: string }>;
		};
	};
}) => {
	const wrapper = document.createElement('span');
	wrapper.className = 'services-event-content';

	const dot = document.createElement('span');
	dot.className = 'services-event-dot';
	wrapper.appendChild(dot);

	const text = document.createElement('span');
	text.className = 'services-event-text';
	text.textContent = `${info.timeText} ${info.event.title}`.trim();
	wrapper.appendChild(text);

	const technicians = info.event.extendedProps.techniciansList ?? [];
	technicians.slice(0, 2).forEach((technician) => {
		const technicianName = technician.name || technician.id;
		const badge = document.createElement('span');
		badge.className = 'services-event-technician';
		badge.textContent = getTechnicianInitials(technicianName);
		badge.title = technicianName;
		wrapper.appendChild(badge);
	});

	return { domNodes: [wrapper] };
};

const mapServicesToEvents = (services: Service[]) =>
	services.map((service) => ({
		id: service.id,
		title:
			service.businessName ||
			service.branchName ||
			service.branchAddress ||
			'Servicio',
		start: service.scheduledAt,
		extendedProps: {
			address: service.branchAddress || '',
			techniciansList: service.technicians ?? [],
			technicians:
				service.technicians?.map((item) => item.name || item.id).join(', ') ||
				'',
		},
	}));

const calendarOptions = {
	plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
	locale: esLocale,
	initialView: 'dayGridMonth',
	initialDate: props.initialDate,
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
	events: mapServicesToEvents(props.services),
	eventClassNames: () => ['services-calendar-event'],
	eventContent: renderEventContent,
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
		emit('select-date', arg.dateStr.split('T')[0] ?? arg.dateStr);
	},
	dayHeaderDidMount: (arg: { date: Date; el: HTMLElement; view: { type: string } }) => {
		if (arg.view.type !== 'timeGridWeek') return;
		arg.el.style.cursor = 'pointer';
		arg.el.addEventListener('click', () => {
			emit('select-date', toDateString(arg.date));
		});
	},
	eventClick: (arg: { event: { id: string } }) => {
		emit('select-service', arg.event.id);
	},
	datesSet: (arg: { view: { currentStart: Date; type: string } }) => {
		const visibleMonthStart = new Date(arg.view.currentStart);
		if (arg.view.type === 'timeGridWeek') {
			visibleMonthStart.setDate(visibleMonthStart.getDate() + 3);
		}
		emit('change-month', {
			year: visibleMonthStart.getFullYear(),
			month: visibleMonthStart.getMonth() + 1,
		});
	},
};

watch(
	() => props.services,
	(services) => {
		const api = calendarRef.value?.getApi();
		if (!api) return;
		api.removeAllEvents();
		api.addEventSource(mapServicesToEvents(services));
	},
	{ deep: true, flush: 'post' },
);

const goToDate = (date: string | Date) => {
	calendarRef.value?.getApi().gotoDate(date);
};

defineExpose({
	goToDate,
});
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

.services-calendar-card :deep(.services-calendar-event) {
	background: transparent !important;
	border: 0 !important;
	box-shadow: none !important;
	color: hsl(var(--foreground));
}

.services-calendar-card :deep(.services-calendar-event .fc-event-main) {
	color: inherit;
}

.services-calendar-card :deep(.fc-timegrid-event.services-calendar-event) {
	padding: 0;
}

.services-calendar-card :deep(.services-event-content) {
	display: flex;
	align-items: center;
	gap: 0.25rem;
	min-width: 0;
	width: 100%;
	color: hsl(var(--foreground));
	font-size: 10px;
	font-weight: 700;
	line-height: 1.2;
}

.services-calendar-card :deep(.services-event-dot) {
	flex: 0 0 auto;
	width: 0.45rem;
	height: 0.45rem;
	border-radius: 999px;
	background: hsl(var(--primary));
}

.services-calendar-card :deep(.services-event-text) {
	min-width: 0;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.services-calendar-card :deep(.services-event-technician) {
	flex: 0 0 auto;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	width: 1rem;
	height: 1rem;
	border-radius: 999px;
	background: hsl(var(--success, var(--primary)) / 0.18);
	border: 1px solid hsl(var(--success, var(--primary)) / 0.45);
	color: hsl(var(--foreground));
	font-size: 0.52rem;
	font-weight: 800;
}
</style>
