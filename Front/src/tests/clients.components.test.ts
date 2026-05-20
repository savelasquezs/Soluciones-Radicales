import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BranchConfigurationForm from '@/modules/clients/components/BranchConfigurationForm.vue';
import BranchHistoryTable from '@/modules/clients/components/BranchHistoryTable.vue';
import BusinessForm from '@/modules/clients/components/BusinessForm.vue';
import ClientForm from '@/modules/clients/components/ClientForm.vue';

describe('clients components', () => {
  it('ClientForm valida name requerido', async () => {
    const wrapper = mount(ClientForm);

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('El nombre del cliente es obligatorio.');
  });

  it('BusinessForm valida name requerido', async () => {
    const wrapper = mount(BusinessForm);

    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.text()).toContain('El nombre del negocio es obligatorio.');
  });

  it('BranchConfigurationForm emite technicianRevenueMode', async () => {
    const wrapper = mount(BranchConfigurationForm, {
      props: {
        initialValue: {
          frequencyDays: 30,
          reinforcementDays: 10,
          reinforcementEnabled: true,
          reinforcementIsPaid: false,
          technicianRevenueMode: 'split',
        },
      },
    });

    const selects = wrapper.findAll('select');
    await selects[2].setValue('full');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({ technicianRevenueMode: 'full' });
  });

  it('BranchHistoryTable muestra empty state', () => {
    const wrapper = mount(BranchHistoryTable, {
      props: {
        services: [],
        emptyMessage: 'Sin historial',
      },
    });

    expect(wrapper.text()).toContain('Sin historial');
  });

  it('BranchHistoryTable muestra filas cuando hay servicios', () => {
    const wrapper = mount(BranchHistoryTable, {
      props: {
        services: [
          {
            id: 's1',
            branchId: 'b1',
            status: 'completed',
            type: 'main',
            scheduledAt: '2026-05-20T14:00:00.000Z',
            price: 250000,
            notes: 'Servicio realizado',
            paymentMethodId: null,
            paymentProofUrl: null,
            createdBy: null,
            createdAt: '2026-05-20T14:00:00.000Z',
          },
        ],
      },
    });

    expect(wrapper.text()).toContain('Completado');
    expect(wrapper.text()).toContain('Servicio realizado');
  });
});
