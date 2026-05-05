export interface Client {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  createdAt: Date;
}
