import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type {
  AddBranchPayload,
  AddBranchResult,
  AddBusinessPayload,
  Branch,
  BranchConfiguration,
  BranchHistoryQuery,
  BranchHistoryResponse,
  BranchHistoryServiceItem,
  Business,
  Client,
  ClientDetail,
  ClientBusinessDetail,
  ClientBranchDetail,
  CreateInitialClientPayload,
  CreateInitialClientResult,
  ServiceCycle,
  UpdateBranchConfigurationPayload,
  UpdateBranchPayload,
  UpdateBusinessPayload,
  UpdateClientPayload,
} from '../types/clients.types';

type BackendClient = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  createdAt?: string;
};

type BackendBusiness = {
  id: string;
  clientId: string;
  name: string;
};

type BackendBranch = {
  id: string;
  businessId: string;
  address: string;
  phone: string | null;
  city: string | null;
  pricePerM2: number | null;
  fixedPrice: number | null;
  frequencyDays: number | null;
  reinforcementDays: number | null;
  reinforcementEnabled: boolean | null;
  reinforcementIsPaid: boolean | null;
  technicianRevenueMode: 'split' | 'full';
  createdAt: string;
};

type BackendServiceCycle = {
  id: string;
  branchId: string;
  active: boolean;
  lastServiceDate: string | null;
  nextMainServiceDate: string | null;
  nextReinforcementDate: string | null;
};

type BackendService = {
  id: string;
  branchId: string;
  status: BranchHistoryServiceItem['status'];
  type: BranchHistoryServiceItem['type'];
  scheduledAt: string | null;
  price: number | null;
  notes: string | null;
  paymentMethodId: string | null;
  paymentProofUrl: string | null;
  createdBy: string | null;
  createdAt: string;
};

type BackendClientDetailResponse = {
  client: BackendClient;
  businesses: Array<{
    business: BackendBusiness;
    branches: Array<{
      branch: BackendBranch;
      serviceCycle: BackendServiceCycle | null;
    }>;
  }>;
};

type BackendCreateInitialClientResponse = {
  client: BackendClient;
  business: BackendBusiness;
  branch: BackendBranch;
  serviceCycle: BackendServiceCycle | null;
};

type BackendAddBranchResponse = {
  branch: BackendBranch;
  serviceCycle: BackendServiceCycle | null;
};

type BackendBranchHistoryResponse = {
  branch: BackendBranch;
  services: BackendService[];
};

const mapClient = (client: BackendClient): Client => ({
  id: client.id,
  name: client.name,
  contactName: client.contactName,
  phone: client.phone,
  createdAt: client.createdAt,
});

const mapBusiness = (business: BackendBusiness): Business => ({
  id: business.id,
  clientId: business.clientId,
  name: business.name,
});

const mapBranch = (branch: BackendBranch): Branch => ({
  id: branch.id,
  businessId: branch.businessId,
  address: branch.address,
  phone: branch.phone,
  city: branch.city,
  pricePerM2: branch.pricePerM2,
  fixedPrice: branch.fixedPrice,
  frequencyDays: branch.frequencyDays,
  reinforcementDays: branch.reinforcementDays,
  reinforcementEnabled: branch.reinforcementEnabled,
  reinforcementIsPaid: branch.reinforcementIsPaid,
  technicianRevenueMode: branch.technicianRevenueMode,
  createdAt: branch.createdAt,
});

const mapServiceCycle = (cycle: BackendServiceCycle | null): ServiceCycle | null => {
  if (!cycle) {
    return null;
  }

  return {
    id: cycle.id,
    branchId: cycle.branchId,
    active: cycle.active,
    lastMainServiceDate: cycle.lastServiceDate,
    nextMainServiceDate: cycle.nextMainServiceDate,
    nextReinforcementDate: cycle.nextReinforcementDate,
  };
};

const mapBranchHistoryService = (service: BackendService): BranchHistoryServiceItem => ({
  id: service.id,
  branchId: service.branchId,
  status: service.status,
  type: service.type,
  scheduledAt: service.scheduledAt,
  price: service.price,
  notes: service.notes,
  paymentMethodId: service.paymentMethodId,
  paymentProofUrl: service.paymentProofUrl,
  createdBy: service.createdBy,
  createdAt: service.createdAt,
});

const mapBranchConfiguration = (branch: BackendBranch): BranchConfiguration => ({
  id: branch.id,
  frequencyDays: branch.frequencyDays,
  reinforcementDays: branch.reinforcementDays,
  reinforcementEnabled: branch.reinforcementEnabled,
  reinforcementIsPaid: branch.reinforcementIsPaid,
  technicianRevenueMode: branch.technicianRevenueMode,
});

const mapBusinessDetail = (item: BackendClientDetailResponse['businesses'][number]): ClientBusinessDetail => ({
  business: mapBusiness(item.business),
  branches: item.branches.map<ClientBranchDetail>((branchItem) => ({
    branch: mapBranch(branchItem.branch),
    serviceCycle: mapServiceCycle(branchItem.serviceCycle),
  })),
});

const mapClientDetail = (detail: BackendClientDetailResponse): ClientDetail => ({
  client: mapClient(detail.client),
  businesses: detail.businesses.map(mapBusinessDetail),
});

const mapCreateInitialClientResult = (
  response: BackendCreateInitialClientResponse,
): CreateInitialClientResult => ({
  client: mapClient(response.client),
  business: mapBusiness(response.business),
  branch: mapBranch(response.branch),
  serviceCycle: mapServiceCycle(response.serviceCycle),
});

const mapAddBranchResult = (response: BackendAddBranchResponse): AddBranchResult => ({
  branch: mapBranch(response.branch),
  serviceCycle: mapServiceCycle(response.serviceCycle),
});

const mapBranchHistoryResponse = (
  response: BackendBranchHistoryResponse,
): BranchHistoryResponse => ({
  branch: mapBranch(response.branch),
  services: response.services.map(mapBranchHistoryService),
});

export const clientsService = {
  async listClients() {
    const response = await http.get<BackendClient[]>(endpoints.clients.list);
    return response.map(mapClient);
  },
  async searchClients(q: string) {
    const response = await http.get<BackendClient[]>(endpoints.clients.search, { params: { q } });
    return response.map(mapClient);
  },
  async getClientById(id: string) {
    const response = await http.get<BackendClient>(endpoints.clients.byId(id));
    return mapClient(response);
  },
  async getClientDetail(id: string) {
    const response = await http.get<BackendClientDetailResponse>(endpoints.clients.detail(id));
    return mapClientDetail(response);
  },
  async createInitialClient(payload: CreateInitialClientPayload) {
    const response = await http.post<BackendCreateInitialClientResponse>(endpoints.clients.create, payload);
    return mapCreateInitialClientResult(response);
  },
  async updateClient(id: string, payload: UpdateClientPayload) {
    const response = await http.patch<BackendClient>(endpoints.clients.byId(id), payload);
    return mapClient(response);
  },
  async addBusinessToClient(clientId: string, payload: AddBusinessPayload) {
    const response = await http.post<BackendBusiness>(endpoints.clients.addBusiness(clientId), payload);
    return mapBusiness(response);
  },
  async updateBusiness(businessId: string, payload: UpdateBusinessPayload) {
    const response = await http.patch<BackendBusiness>(endpoints.clients.updateBusiness(businessId), payload);
    return mapBusiness(response);
  },
  async addBranchToBusiness(businessId: string, payload: AddBranchPayload) {
    const response = await http.post<BackendAddBranchResponse>(endpoints.clients.addBranch(businessId), payload);
    return mapAddBranchResult(response);
  },
  async updateBranch(branchId: string, payload: UpdateBranchPayload) {
    const response = await http.patch<BackendBranch>(endpoints.clients.updateBranch(branchId), payload);
    return mapBranch(response);
  },
  async updateBranchConfiguration(branchId: string, payload: UpdateBranchConfigurationPayload) {
    const response = await http.patch<BackendBranch>(endpoints.clients.updateBranchConfiguration(branchId), payload);
    return mapBranchConfiguration(response);
  },
  async getBranchHistory(branchId: string, query?: BranchHistoryQuery) {
    const response = await http.get<BackendBranchHistoryResponse>(endpoints.clients.branchHistory(branchId), {
      params: query,
    });
    return mapBranchHistoryResponse(response);
  },
};
