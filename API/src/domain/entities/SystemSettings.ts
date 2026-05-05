export interface SystemSettings {
  id: string;
  businessName: string;
  logoUrl: string | null;
  defaultFrequencyDays: number;
  defaultReinforcementDays: number;
  reinforcementEnabledDefault: boolean;
  reinforcementIsPaidDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}
