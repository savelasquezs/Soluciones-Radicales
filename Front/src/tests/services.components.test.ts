import { describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import AssignTechniciansModal from '@/modules/services/components/AssignTechniciansModal.vue';
import ServiceDayList from '@/modules/services/components/ServiceDayList.vue';
import ServiceEvidenceList from '@/modules/services/components/ServiceEvidenceList.vue';
import ServiceForm from '@/modules/services/components/ServiceForm.vue';
import ServicesCalendar from '@/modules/services/components/ServicesCalendar.vue';
import ServiceStatusBadge from '@/modules/services/components/ServiceStatusBadge.vue';
import { usersService } from '@/modules/users/services/users.service';

vi.mock('@/modules/users/services/users.service', () => ({
  usersService: {
    listTechnicians: vi.fn(),
  },
}));

describe('services components', () => {
  it('ServiceStatusBadge renderiza estados principales', () => {
    const wrapper = mount(ServiceStatusBadge, { props: { status: 'pending' } });
    expect(wrapper.text()).toContain('Pendiente');
  });

  it('ServicesCalendar emite selección de fecha y evento', async () => {
    const wrapper = mount(ServicesCalendar, {
      props: {
        services: [
          {
            id: 'service-1',
            branchId: 'branch-1',
            scheduledAt: '2026-05-20T10:00:00.000Z',
            status: 'pending',
            type: 'main',
          },
        ],
      },
    });

    await wrapper.find('[data-testid="fc-date-click"]').trigger('click');
    await wrapper.find('[data-testid="fc-event-click"]').trigger('click');

    expect(wrapper.emitted('select-date')?.[0]?.[0]).toBe('2026-05-20');
    expect(wrapper.emitted('select-service')?.[0]?.[0]).toBe('service-1');
  });

  it('ServiceDayList muestra empty state y lista', () => {
    const empty = mount(ServiceDayList, { props: { services: [] } });
    expect(empty.text()).toContain('No hay servicios');

    const withItems = mount(ServiceDayList, {
      props: {
        services: [
          {
            id: 'service-1',
            branchId: 'branch-1',
            scheduledAt: '2026-05-20T10:00:00.000Z',
            status: 'pending',
            type: 'main',
          },
        ],
      },
    });
    expect(withItems.text()).toContain('branch-1');
  });

  it('ServiceForm valida branchId y scheduledAt', async () => {
    const wrapper = mount(ServiceForm);
    await wrapper.find('form').trigger('submit.prevent');
    expect(wrapper.text()).toContain('branchId es obligatorio');
  });

  it('AssignTechniciansModal lista técnicos y guarda selección', async () => {
    vi.mocked(usersService.listTechnicians).mockResolvedValue([
      { id: 'tech-1', name: 'Técnico 1' },
      { id: 'tech-2', name: 'Técnico 2' },
    ] as any);

    const wrapper = mount(AssignTechniciansModal, {
      props: {
        open: true,
      },
    });

    await flushPromises();
    const checkboxes = wrapper.findAll('input[type="checkbox"]');
    await checkboxes[0].setValue(true);
    const saveButton = wrapper.findAll('button').find((item) => item.text() === 'Guardar');
    await saveButton?.trigger('click');

    expect(wrapper.emitted('submit')?.[0]?.[0]).toEqual(['tech-1']);
  });

  it('ServiceEvidenceList muestra empty state y evidencias', () => {
    const empty = mount(ServiceEvidenceList, { props: { evidences: [] } });
    expect(empty.text()).toContain('No hay evidencias');

    const withItems = mount(ServiceEvidenceList, {
      props: { evidences: [{ id: 'ev-1', serviceId: 's1', fileUrl: 'https://test/image.jpg' }] },
    });
    expect(withItems.text()).toContain('Abrir evidencia');
  });
});
