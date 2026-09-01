export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  verifiedPurchase: boolean;
  createdAt?: string;
}
