import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import BranchHistoryPage from '@/modules/clients/pages/BranchHistoryPage.vue';
import InitialClientForm from '@/modules/clients/components/InitialClientForm.vue';
import ClientDetailPage from '@/modules/clients/pages/ClientDetailPage.vue';
import ClientsPage from '@/modules/clients/pages/ClientsPage.vue';
import { clientsService } from '@/modules/clients/services/clients.service';
import { servicesService } from '@/modules/services/services/services.service';

const { push, back, routeState, toastPush } = vi.hoisted(() => ({
  push: vi.fn(),
  back: vi.fn(),
  toastPush: vi.fn(),
  routeState: {
    params: {
      id: 'client-1',
      branchId: 'branch-1',
    },
  },
}));

vi.mock('vue-router', () => ({
  useRouter: () => ({ push, back }),
  useRoute: () => routeState,
}));

vi.mock('@/shared/composables/useToast', () => ({
  useToast: () => ({
    push: toastPush,
    messages: { value: [] },
  }),
}));

vi.mock('@/modules/clients/services/clients.service', () => ({
  clientsService: {
    listClients: vi.fn(),
    searchClients: vi.fn(),
    getClientById: vi.fn(),
    getClientDetail: vi.fn(),
    createInitialClient: vi.fn(),
    updateClient: vi.fn(),
    addBusinessToClient: vi.fn(),
    updateBusiness: vi.fn(),
    addBranchToBusiness: vi.fn(),
    updateBranch: vi.fn(),
    updateBranchCycle: vi.fn(),
    updateBranchConfiguration: vi.fn(),
    getBranchHistory: vi.fn(),
  },
}));

vi.mock('@/modules/services/services/services.service', () => ({
  servicesService: {
    createService: vi.fn(),
  },
}));

const clientDetailMock = {
  client: {
    id: 'client-1',
    name: 'Cliente A',
    contactName: 'Ana',
    phone: '3001234567',
  },
  businesses: [
    {
      business: { id: 'business-1', clientId: 'client-1', name: 'Negocio A' },
      branches: [
        {
          branch: {
            id: 'branch-1',
            businessId: 'business-1',
            address: 'Calle 123 # 45-67',
            phone: '3001234567',
            city: 'Bogota',
            pricePerM2: 1200,
            fixedPrice: null,
            frequencyDays: 30,
            reinforcementDays: 10,
            reinforcementEnabled: true,
            reinforcementIsPaid: false,
            technicianRevenueMode: 'split',
            createdAt: '2026-05-20T00:00:00.000Z',
          },
          serviceCycle: {
            id: 'cycle-1',
            branchId: 'branch-1',
            active: true,
            lastMainServiceDate: null,
            nextMainServiceDate: '2026-06-01T00:00:00.000Z',
            nextReinforcementDate: '2026-05-25T00:00:00.000Z',
          },
        },
      ],
    },
  ],
};

const historyMock = {
  branch: {
    id: 'branch-1',
    businessId: 'business-1',
    address: 'Calle 123 # 45-67',
    phone: '3001234567',
    city: 'Bogota',
    pricePerM2: 1200,
    fixedPrice: null,
    frequencyDays: 30,
    reinforcementDays: 10,
    reinforcementEnabled: true,
    reinforcementIsPaid: false,
    technicianRevenueMode: 'split',
    createdAt: '2026-05-20T00:00:00.000Z',
  },
  services: [],
};

describe('clients pages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.mocked(clientsService.listClients).mockResolvedValue([
      { id: 'client-1', name: 'Cliente A', contactName: 'Ana', phone: '3001234567' },
    ] as any);
    vi.mocked(clientsService.searchClients).mockResolvedValue([
      { id: 'client-2', name: 'Cliente B', contactName: 'Luis', phone: '3010000000' },
    ] as any);
    vi.mocked(clientsService.getClientDetail).mockResolvedValue(clientDetailMock as any);
    vi.mocked(clientsService.getBranchHistory).mockResolvedValue(historyMock as any);
    vi.mocked(clientsService.createInitialClient).mockResolvedValue({
      client: { id: 'client-1', name: 'Cliente A', contactName: 'Ana', phone: '3001234567' },
      business: { id: 'business-1', clientId: 'client-1', name: 'Negocio A' },
      branch: {
        id: 'branch-1',
        businessId: 'business-1',
        address: 'Calle 123 # 45-67',
        phone: '3001234567',
        city: 'Bogota',
        pricePerM2: null,
        fixedPrice: 250000,
        frequencyDays: 30,
        reinforcementDays: 10,
        reinforcementEnabled: true,
        reinforcementIsPaid: false,
        technicianRevenueMode: 'split',
        createdAt: '2026-05-20T00:00:00.000Z',
      },
      serviceCycle: null,
    } as any);
    vi.mocked(servicesService.createService).mockResolvedValue({} as any);
    vi.mocked(clientsService.updateBranch).mockResolvedValue({} as any);
    vi.mocked(clientsService.updateBranchCycle).mockResolvedValue({
      id: 'cycle-1',
      branchId: 'branch-1',
      active: true,
      lastMainServiceDate: null,
      nextMainServiceDate: '2099-12-31T12:00:00.000Z',
      nextReinforcementDate: '2100-01-10T12:00:00.000Z',
    } as any);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ClientsPage carga lista al montar', async () => {
    mount(ClientsPage);
    await flushPromises();

    expect(clientsService.listClients).toHaveBeenCalled();
  });

  it('ClientsPage busca clientes', async () => {
    const wrapper = mount(ClientsPage);
    await flushPromises();

    await wrapper.find('input').setValue('Cliente B');
    await vi.advanceTimersByTimeAsync(400);
    await flushPromises();

    expect(clientsService.searchClients).toHaveBeenCalledWith('Cliente B');
  });

  it('ClientsPage abre modal de nuevo cliente', async () => {
    const wrapper = mount(ClientsPage);
    await flushPromises();

    const button = wrapper.findAll('button').find((item) => item.text() === 'Nuevo cliente');
    await button?.trigger('click');

    expect(wrapper.text()).toContain('Crea cliente, negocio y sucursal inicial');
  });

  it('ClientDetailPage carga detalle', async () => {
    mount(ClientDetailPage);
    await flushPromises();

    expect(clientsService.getClientDetail).toHaveBeenCalledWith('client-1');
  });

  it('ClientDetailPage permite abrir modal de configuracion de sucursal', async () => {
    const wrapper = mount(ClientDetailPage);
    await flushPromises();

    const configButton = wrapper.findAll('button').find((item) => item.text() === 'Configuracion');
    await configButton?.trigger('click');
    await flushPromises();

    expect(wrapper.text()).toContain('Configuración de sucursal');
  });

  it('BranchHistoryPage llama historial con filtros', async () => {
    const wrapper = mount(BranchHistoryPage);
    await flushPromises();

    const inputs = wrapper.findAll('input');
    await inputs[0].setValue('2026-05-01');
    await inputs[1].setValue('2026-05-31');

    const selects = wrapper.findAll('select');
    await selects[0].setValue('completed');
    await selects[1].setValue('main');

    const button = wrapper.findAll('button').find((item) => item.text() === 'Aplicar filtros');
    await button?.trigger('click');
    await flushPromises();

    expect(clientsService.getBranchHistory).toHaveBeenLastCalledWith(
      'branch-1',
      expect.objectContaining({
        status: 'completed',
        type: 'main',
      }),
    );
  });

  it('ClientDetailPage espera updateBranchCycleDates antes del refresh', async () => {
    let resolveCycleUpdate: (value: any) => void = () => undefined;
    const cyclePromise = new Promise((resolve) => {
      resolveCycleUpdate = resolve;
    });
    vi.mocked(clientsService.updateBranchCycle).mockReturnValueOnce(cyclePromise as any);

    const BranchFormStub = defineComponent({
      emits: ['submit'],
      template:
        '<button type="button" data-testid="branch-form-submit" @click="$emit(\'submit\', { address: \'Calle 123 # 45-67\', city: \'Medellín\', phone: \'3001234567\', pricingMode: \'square_meter\', pricePerM2: 1200, squareMeters: 100, fixedPrice: 120000, nextMainServiceDate: \'2099-12-31T12:00:00.000Z\', nextReinforcementDate: \'2100-01-10T12:00:00.000Z\' })">submit</button>',
    });

    const wrapper = mount(ClientDetailPage, {
      global: {
        stubs: {
          BranchForm: BranchFormStub,
        },
      },
    });
    await flushPromises();

    const editBranchButton = wrapper.findAll('button').find((item) => item.text() === 'Editar sucursal');
    await editBranchButton?.trigger('click');
    await flushPromises();

    await wrapper.find('[data-testid="branch-form-submit"]').trigger('click');
    await flushPromises();

    expect(clientsService.updateBranch).toHaveBeenCalled();
    expect(clientsService.updateBranchCycle).toHaveBeenCalled();
    expect(clientsService.getClientDetail).toHaveBeenCalledTimes(1);

    resolveCycleUpdate({
      id: 'cycle-1',
      branchId: 'branch-1',
      active: true,
      lastMainServiceDate: null,
      nextMainServiceDate: '2099-12-31T12:00:00.000Z',
      nextReinforcementDate: '2100-01-10T12:00:00.000Z',
    });
    await flushPromises();

    expect(clientsService.getClientDetail).toHaveBeenCalledTimes(2);
  });

  it('ClientsPage crea servicio inicial si viene nextMainServiceDate', async () => {
    const wrapper = mount(ClientsPage);
    await flushPromises();

    const button = wrapper.findAll('button').find((item) => item.text() === 'Nuevo cliente');
    await button?.trigger('click');
    await flushPromises();

    await wrapper.findComponent(InitialClientForm).vm.$emit('submit', {
      client: { name: 'Cliente A', contactName: 'Ana', phone: '3001234567' },
      businessName: 'Negocio A',
      branch: { address: 'Calle 123 # 45-67', city: 'Bogota' },
      nextMainServiceDate: '2099-12-31T12:00:00.000Z',
    });
    await flushPromises();

    expect(servicesService.createService).toHaveBeenCalledWith({
      branchId: 'branch-1',
      scheduledAt: '2099-12-31T12:00:00.000Z',
      type: 'main',
      status: 'pending',
      price: 250000,
    });
  });
});
