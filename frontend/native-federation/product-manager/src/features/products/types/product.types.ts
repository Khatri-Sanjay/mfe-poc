export interface ApiResponse<T> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage?: boolean;
  hasPreviousPage?: boolean;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string | null;
  sortOrder?: number | null;
  isPrimary?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  sku: string;
  barcode?: string | null;
  options?: Record<string, string> | null;
  price: string | number;
  compareAtPrice?: string | number | null;
  currency?: string;
  quantityAvailable?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  shortDescription?: string | null;
  status?: ProductStatus;
  category?: ProductRelation | string | null;
  categories?: ProductRelation[];
  brand?: ProductRelation | string | null;
  price?: string | number;
  compareAtPrice?: string | number | null;
  stock?: number;
  isActive?: boolean;
  images?: ProductImage[];
  variants?: ProductVariant[];
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductRelation {
  id?: string;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}

export type ProductSortBy = 'createdAt' | 'name' | 'price';
export type SortOrder = 'asc' | 'desc';

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  minPrice?: number;
  maxPrice?: number;
  inStock?: boolean;
  sortBy?: ProductSortBy;
  sortOrder?: SortOrder;
}

export interface CreateProductInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  brandId?: string;
  categoryIds?: string[];
  status?: ProductStatus;
  images?: CreateProductImageInput[];
  variants: CreateProductVariantInput[];
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, 'variants'>>;

export interface CreateProductImageInput {
  url: string;
  altText?: string;
  sortOrder?: number;
  isPrimary?: boolean;
}

export type UpdateProductImageInput = Partial<CreateProductImageInput>;

export interface CreateProductVariantInput {
  name: string;
  sku: string;
  barcode?: string;
  options?: Record<string, string>;
  price: string;
  compareAtPrice?: string;
  costPrice?: string;
  currency?: string;
  weight?: string;
  quantityOnHand?: number;
  isActive?: boolean;
}

export type UpdateProductVariantInput = Partial<CreateProductVariantInput>;
