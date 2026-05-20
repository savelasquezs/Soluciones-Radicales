import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import BranchHistoryPage from '@/modules/clients/pages/BranchHistoryPage.vue';
import ClientDetailPage from '@/modules/clients/pages/ClientDetailPage.vue';
import ClientsPage from '@/modules/clients/pages/ClientsPage.vue';
import { clientsService } from '@/modules/clients/services/clients.service';

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
    updateBranchConfiguration: vi.fn(),
    getBranchHistory: vi.fn(),
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
            address: 'Calle 1',
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
    address: 'Calle 1',
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
});
