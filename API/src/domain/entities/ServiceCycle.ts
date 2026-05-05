export interface ServiceCycle {
  id: string;
  branchId: string;
  lastServiceDate: Date | null;
  nextMainServiceDate: Date | null;
  nextReinforcementDate: Date | null;
  active: boolean;
}
