export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description?: string;
  price: string;
  currency: string;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  isActive: boolean;
}
