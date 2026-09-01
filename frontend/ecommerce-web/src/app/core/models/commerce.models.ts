export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  status: string;
  emailVerified: boolean;
  roles: string[];
  permissions: string[];
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: 'Bearer';
  accessTokenExpiresIn: number;
  refreshTokenExpiresAt: string;
  user: User;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  parentId: string | null;
  imageUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  options: Record<string, string>;
  price: string;
  compareAtPrice: string | null;
  currency: string;
  isActive: boolean;
  quantityAvailable: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  status: string;
  brand: Brand | null;
  categories: Category[];
  images: ProductImage[];
  variants: ProductVariant[];
  averageRating: number;
  reviewCount: number;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: 'createdAt' | 'name' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface CartItem {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  slug: string;
  sku: string;
  imageUrl: string | null;
  options: Record<string, string>;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  itemCount: number;
}

export interface WishlistItem {
  productId: string;
  name: string;
  slug: string;
  imageUrl: string | null;
}

export interface Wishlist {
  items: WishlistItem[];
}

export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  company: string | null;
  addressLine1: string;
  addressLine2: string | null;
  city: string;
  state: string | null;
  postalCode: string;
  countryCode: string;
  phone: string | null;
  isDefaultShipping: boolean;
  isDefaultBilling: boolean;
}

export interface AddressPayload {
  firstName: string;
  lastName: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode: string;
  countryCode: string;
  phone?: string;
  isDefaultShipping?: boolean;
  isDefaultBilling?: boolean;
}

export interface ShippingMethod {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: string;
  currency: string;
  estimatedMinDays: number;
  estimatedMaxDays: number;
  isActive: boolean;
}

export interface CheckoutQuote {
  cart: Cart;
  shippingMethod: ShippingMethod | null;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
}

export interface CheckoutResult {
  order: Order;
  payment: {
    id: string;
    status: string;
    amount: string;
    currency: string;
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  productName: string;
  sku: string;
  variantOptions: Record<string, string>;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
  currency: string;
}

export interface Order {
  id: string;
  status: string;
  subtotal: string;
  discountTotal: string;
  shippingTotal: string;
  taxTotal: string;
  grandTotal: string;
  currency: string;
  items: OrderItem[];
}

export interface Review {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string | null;
  status: string;
  verifiedPurchase: boolean;
}

export interface ReviewPayload {
  rating: number;
  title: string;
  comment?: string;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  value: string;
  minimumOrderAmount: string | null;
  maximumDiscountAmount: string | null;
  startsAt: string | null;
  expiresAt: string | null;
  usageLimit: number | null;
  usageLimitPerUser: number | null;
  usageCount: number;
  isActive: boolean;
}

export interface InventoryItem {
  variantId: string;
  sku: string;
  productName: string;
  variantName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel: number;
}

export interface Refund {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  status: string;
  reason: string;
}
