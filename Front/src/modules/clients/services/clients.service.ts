import { endpoints } from '@/shared/api/endpoints';
import { http } from '@/shared/api/http';
import type {
  AddBranchPayload,
  AddBusinessPayload,
  Branch,
  BranchConfiguration,
  BranchHistoryQuery,
  BranchHistoryResponse,
  Business,
  Client,
  ClientDetail,
  CreateInitialClientPayload,
  UpdateBranchConfigurationPayload,
  UpdateBranchPayload,
  UpdateBusinessPayload,
  UpdateClientPayload,
} from '../types/clients.types';

export const clientsService = {
  listClients() {
    return http.get<Client[]>(endpoints.clients.list);
  },
  searchClients(q: string) {
    return http.get<Client[]>(endpoints.clients.search, { params: { q } });
  },
  getClientById(id: string) {
    return http.get<Client>(endpoints.clients.byId(id));
  },
  getClientDetail(id: string) {
    return http.get<ClientDetail>(endpoints.clients.detail(id));
  },
  createInitialClient(payload: CreateInitialClientPayload) {
    return http.post<{ client: Client; business: Business; branch: Branch }>(endpoints.clients.create, payload);
  },
  updateClient(id: string, payload: UpdateClientPayload) {
    return http.patch<Client>(endpoints.clients.byId(id), payload);
  },
  addBusinessToClient(clientId: string, payload: AddBusinessPayload) {
    return http.post<Business>(endpoints.clients.addBusiness(clientId), payload);
  },
  updateBusiness(businessId: string, payload: UpdateBusinessPayload) {
    return http.patch<Business>(endpoints.clients.updateBusiness(businessId), payload);
  },
  addBranchToBusiness(businessId: string, payload: AddBranchPayload) {
    return http.post<{ branch: Branch; serviceCycle: unknown; service: unknown }>(
      endpoints.clients.addBranch(businessId),
      payload,
    );
  },
  updateBranch(branchId: string, payload: UpdateBranchPayload) {
    return http.patch<Branch>(endpoints.clients.updateBranch(branchId), payload);
  },
  updateBranchConfiguration(branchId: string, payload: UpdateBranchConfigurationPayload) {
    return http.patch<BranchConfiguration>(endpoints.clients.updateBranchConfiguration(branchId), payload);
  },
  getBranchHistory(branchId: string, query?: BranchHistoryQuery) {
    return http.get<BranchHistoryResponse>(endpoints.clients.branchHistory(branchId), {
      params: query,
    });
  },
};
