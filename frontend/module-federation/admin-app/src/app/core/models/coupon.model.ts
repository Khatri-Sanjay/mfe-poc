export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  minimumOrderAmount?: string;
  maximumDiscountAmount?: string;
  startsAt?: string;
  expiresAt?: string;
  usageLimit?: number;
  usageLimitPerUser?: number;
  usageCount: number;
  isActive: boolean;
}
