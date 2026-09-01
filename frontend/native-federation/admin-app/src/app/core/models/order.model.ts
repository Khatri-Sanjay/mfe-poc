export interface Order {
  id: string;
  status: OrderStatus;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  items: OrderItem[];
  user?: { id: string; firstName: string; lastName: string; email: string };
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'PARTIALLY_REFUNDED'
  | 'REFUNDED';
