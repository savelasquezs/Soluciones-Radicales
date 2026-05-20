import { beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import ServiceDetailPage from '@/modules/services/pages/ServiceDetailPage.vue';
import ServicesCalendarPage from '@/modules/services/pages/ServicesCalendarPage.vue';
import ServicesPage from '@/modules/services/pages/ServicesPage.vue';
import ServicesCalendar from '@/modules/services/components/ServicesCalendar.vue';
import { servicesService } from '@/modules/services/services/services.service';
import { settingsService } from '@/modules/settings/services/settings.service';
import { usersService } from '@/modules/users/services/users.service';

const { push, routeState, toastPush } = vi.hoisted(() => ({
  push: vi.fn(),
  toastPush: vi.fn(),
  routeState: {
    params: {
      id: 'service-1',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push }),
  useRoute: () => routeState,
}));

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => ({
    push: toastPush,
    messages: { value: [] },
  }),
}));

vi.mock('@/modules/services/services/services.service', () => ({
  servicesService: {
    getServicesByMonth: vi.fn(),
    getServicesByDay: vi.fn(),
    createService: vi.fn(),
    getTechnicianSchedule: vi.fn(),
    getServiceById: vi.fn(),
    assignTechniciansToService: vi.fn(),
    rescheduleService: vi.fn(),
    cancelService: vi.fn(),
    updateServiceStatus: vi.fn(),
    generateReinforcementService: vi.fn(),
    listServiceEvidences: vi.fn(),
    updateServicePayment: vi.fn(),
  },
}));

vi.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    listTechnicians: vi.fn(),
  },
}));

vi.mock('@/modules/settings/services/settings.service', () => ({
  settingsService: {
    listPaymentMethods: vi.fn(),
  },
}));


const mockService = {
  id: 'service-1',
  branchId: 'branch-1',
  scheduledAt: '2026-05-20T10:00:00.000Z',
  status: 'pending',
  type: 'main',
  paymentMethodId: null,
};

describe('services pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(servicesService.getServicesByMonth).mockResolvedValue([mockService] as any);
    vi.mocked(servicesService.getServicesByDay).mockResolvedValue([mockService] as any);
    vi.mocked(servicesService.createService).mockResolvedValue(mockService as any);
    vi.mocked(servicesService.getTechnicianSchedule).mockResolvedValue({
      technician: { id: 'tech-1', name: 'Tech', isTechnician: true },
      services: [mockService],
    } as any);
    vi.mocked(servicesService.getServiceById).mockResolvedValue(mockService as any);
    vi.mocked(servicesService.assignTechniciansToService).mockResolvedValue({ success: true } as any);
    vi.mocked(servicesService.rescheduleService).mockResolvedValue(mockService as any);
    vi.mocked(servicesService.cancelService).mockResolvedValue({ ...mockService, status: 'canceled' } as any);
    vi.mocked(servicesService.updateServiceStatus).mockResolvedValue({ ...mockService, status: 'confirmed' } as any);
    vi.mocked(servicesService.generateReinforcementService).mockResolvedValue({ ...mockService, id: 'service-2', type: 'reinforcement' } as any);
    vi.mocked(servicesService.listServiceEvidences).mockResolvedValue([]);
    vi.mocked(servicesService.updateServicePayment).mockResolvedValue(mockService as any);
    vi.mocked(usersService.listTechnicians).mockResolvedValue([{ id: 'tech-1', name: 'Tech 1' }] as any);
    vi.mocked(settingsService.listPaymentMethods).mockResolvedValue([{ id: 'pm-1', name: 'Efectivo', type: 'cash', active: true }] as any);
  });

  it('ServicesPage carga servicios iniciales', async () => {
    mount(ServicesPage);
    await flushPromises();
    expect(servicesService.getServicesByMonth).toHaveBeenCalled();
  });

  it('ServicesPage filtra por tÃ©cnico y muestra programaciÃ³n', async () => {
    const wrapper = mount(ServicesPage);
    await flushPromises();
    const selects = wrapper.findAll('select');
    await selects[2].setValue('tech-1');
    await flushPromises();
    expect(servicesService.getTechnicianSchedule).toHaveBeenCalledWith('tech-1');
  });

  it('ServicesCalendarPage carga servicios del mes', async () => {
    mount(ServicesCalendarPage);
    await flushPromises();
    expect(servicesService.getServicesByMonth).toHaveBeenCalled();
  });

  it('ServicesCalendarPage muestra servicios del dÃ­a seleccionado', async () => {
    const wrapper = mount(ServicesCalendarPage);
    await flushPromises();
    wrapper.findComponent(ServicesCalendar).vm.$emit('select-date', '2026-05-20');
    await flushPromises();
    expect(servicesService.getServicesByDay).toHaveBeenCalled();
  });

  it('ServiceDetailPage carga detalle', async () => {
    mount(ServiceDetailPage);
    await flushPromises();
    expect(servicesService.getServiceById).toHaveBeenCalledWith('service-1');
  });

  it('ServiceDetailPage abre modal de asignaciÃ³n de tÃ©cnicos', async () => {
    const wrapper = mount(ServiceDetailPage);
    await flushPromises();
    const button = wrapper.findAll('button').find((item) => item.text().includes('Asignar'));
    await button?.trigger('click');
    await flushPromises();
    expect(wrapper.text()).toContain('Guardar');
  });

  it('ServiceDetailPage permite reprogramar', async () => {
    const wrapper = mount(ServiceDetailPage);
    await flushPromises();
    const button = wrapper.findAll('button').find((item) => item.text() === 'Reprogramar');
    await button?.trigger('click');
    await flushPromises();
    await wrapper.find('input').setValue('2026-05-22T08:30:00.000Z');
    await wrapper.findAll('button').find((item) => item.text() === 'Guardar')?.trigger('click');
    await flushPromises();
    expect(servicesService.rescheduleService).toHaveBeenCalled();
  });

  it('ServiceDetailPage exige confirmaciÃ³n para cancelar', async () => {
    const wrapper = mount(ServiceDetailPage);
    await flushPromises();
    const openButton = wrapper.findAll('button').find((item) => item.text() === 'Cancelar');
    await openButton?.trigger('click');
    await flushPromises();
    const confirmButton = wrapper.findAll('button').find((item) => item.text().includes('Confirmar'));
    expect(confirmButton).toBeTruthy();
  });

  it('ServiceDetailPage permite generar refuerzo', async () => {
    const wrapper = mount(ServiceDetailPage);
    await flushPromises();
    const button = wrapper.findAll('button').find((item) => item.text() === 'Generar refuerzo');
    await button?.trigger('click');
    await flushPromises();
    expect(servicesService.generateReinforcementService).toHaveBeenCalledWith('service-1');
  });
});
