export type AdminFormValue = string | number | boolean;
export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface AdminUserForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  status: UserStatus;
  emailVerified: boolean;
  roles: string[];
}

export interface AdminProductImageForm {
  id?: string;
  url: string;
  altText: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface AdminProductVariantForm {
  id?: string;
  sku: string;
  barcode: string;
  name: string;
  optionName: string;
  optionValue: string;
  price: string;
  compareAtPrice: string;
  costPrice: string;
  currency: string;
  weight: string;
  quantityOnHand: number;
  isActive: boolean;
}

export interface AdminProductForm {
  name: string;
  slug: string;
  shortDescription: string;
  description: string;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  brandId: string;
  categoryIds: string[];
  seoTitle: string;
  seoDescription: string;
  images: AdminProductImageForm[];
  variants: AdminProductVariantForm[];
}
