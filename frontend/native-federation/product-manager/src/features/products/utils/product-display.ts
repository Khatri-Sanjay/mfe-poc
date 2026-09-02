import type { Product, ProductRelation, ProductVariant } from '../types/product.types';

export function productRelationLabel(value: ProductRelation | string | null | undefined): string {
  if (!value) return '-';
  if (typeof value === 'string') return value;
  return value.name ?? value.slug ?? value.id ?? '-';
}

export function productRelationInputValue(value: ProductRelation | string | null | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.id ?? value.slug ?? value.name ?? '';
}

export function productCategoryLabel(product: Product): string {
  if (product.categories?.length) {
    return product.categories.map(productRelationLabel).join(', ');
  }

  return productRelationLabel(product.category);
}

export function productCategoryIdsInputValue(product: Product | undefined): string {
  return product?.categories?.map((category) => category.id).filter(Boolean).join(', ') ?? '';
}

export function productPrimaryVariant(product: Product | undefined): ProductVariant | undefined {
  return product?.variants?.[0];
}

export function productPrice(product: Product): string | number {
  return product.price ?? productPrimaryVariant(product)?.price ?? 0;
}

export function productCompareAtPrice(product: Product | undefined): string | number | null | undefined {
  return product?.compareAtPrice ?? productPrimaryVariant(product)?.compareAtPrice;
}

export function productStock(product: Product): number {
  return product.stock ?? productPrimaryVariant(product)?.quantityAvailable ?? 0;
}

export function productIsActive(product: Product): boolean {
  return product.isActive ?? product.status === 'ACTIVE';
}
