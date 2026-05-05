export interface Branch {
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
  createdAt: Date;
}
