import { describe, expect, it } from 'vitest';
import { mount } from '@vue/test-utils';
import BranchConfigurationForm from '@/modules/clients/components/BranchConfigurationForm.vue';
import BranchForm from '@/modules/clients/components/BranchForm.vue';
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

  it('BranchForm en modo fijo no muestra precio por m2', () => {
    const wrapper = mount(BranchForm, {
      props: {
        initialValue: {
          address: 'Calle 123 # 45-67',
          city: 'Medellín',
          phone: '3001234567',
          fixedPrice: 150000,
          pricePerM2: null,
          nextMainServiceDate: '2099-12-31T12:00:00.000Z',
          reinforcementDays: 10,
        },
      },
    });

    expect(wrapper.text()).toContain('Precio fijo');
    expect(wrapper.find('input[placeholder="1200"]').exists()).toBe(false);
  });

  it('BranchForm en modo precio por m2 calcula valor total al guardar', async () => {
    const wrapper = mount(BranchForm, {
      props: {
        initialValue: {
          address: 'Calle 123 # 45-67',
          city: 'Medellín',
          phone: '3001234567',
          fixedPrice: 240000,
          pricePerM2: 1200,
          nextMainServiceDate: '2099-12-31T12:00:00.000Z',
          reinforcementDays: 10,
        },
      },
    });

    await wrapper.find('input[placeholder="1200"]').setValue('1200');
    await wrapper.find('input[placeholder="100"]').setValue('200');
    await wrapper.find('form').trigger('submit.prevent');

    expect(wrapper.emitted('submit')?.[0]?.[0]).toMatchObject({
      pricePerM2: 1200,
      squareMeters: 200,
      fixedPrice: 240000,
    });
  });

  it('BranchForm infiere metros cuadrados al editar', () => {
    const wrapper = mount(BranchForm, {
      props: {
        initialValue: {
          address: 'Calle 123 # 45-67',
          city: 'Medellín',
          phone: '3001234567',
          fixedPrice: 240000,
          pricePerM2: 1200,
          nextMainServiceDate: '2099-12-31T12:00:00.000Z',
          reinforcementDays: 10,
        },
      },
    });

    expect((wrapper.find('input[placeholder="100"]').element as HTMLInputElement).value).toBe('200');
  });
});
