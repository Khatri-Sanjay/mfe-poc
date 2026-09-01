export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  brand?: Brand;
  categories: Category[];
  images: ProductImage[];
  variants: ProductVariant[];
  averageRating?: number;
  reviewCount?: number;
  createdAt?: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  barcode?: string;
  name: string;
  options?: Record<string, string>;
  price: string;
  compareAtPrice?: string;
  costPrice?: string;
  currency: string;
  weight?: string;
  isActive: boolean;
  quantityAvailable: number;
  quantityOnHand?: number;
}

export interface CreateProductRequest {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  brandId?: string;
  categoryIds?: string[];
  status?: string;
  seoTitle?: string;
  seoDescription?: string;
  images?: { url: string; altText?: string; sortOrder?: number; isPrimary?: boolean }[];
  variants: {
    sku: string;
    barcode?: string;
    name: string;
    options?: Record<string, string>;
    price: string;
    compareAtPrice?: string;
    costPrice?: string;
    currency?: string;
    weight?: string;
    isActive?: boolean;
    quantityOnHand?: number;
  }[];
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  websiteUrl?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  imageUrl?: string;
  isActive: boolean;
  sortOrder: number;
}
