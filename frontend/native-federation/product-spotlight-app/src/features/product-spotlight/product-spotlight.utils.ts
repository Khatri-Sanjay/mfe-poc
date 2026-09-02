import type { Product, ProductVariant } from './product-spotlight.types';

export function findBestDeal(products: Product[]): { product: Product; variant: ProductVariant; discount: number } | null {
  let current: { product: Product; variant: ProductVariant; discount: number } | null = null;

  for (const product of products) {
    const variant = primaryVariant(product);
    if (!variant) continue;

    const price = Number(variant.price);
    const compareAt = Number(variant.compareAtPrice ?? 0);
    const discount = compareAt > price ? Math.round(((compareAt - price) / compareAt) * 100) : 0;

    if (!current || discount > current.discount) {
      current = { product, variant, discount };
    }
  }

  return current;
}

export function primaryVariant(product: Product): ProductVariant | undefined {
  return product.variants.find((variant) => variant.quantityAvailable > 0) ?? product.variants[0];
}

export function imageUrl(product: Product): string {
  return (
    product.images.find((image) => image.isPrimary)?.url ??
    product.images[0]?.url ??
    'https://placehold.co/900x700/f4f7f6/19302d?text=Product'
  );
}

export function formatMoney(value: string, currency: string): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency,
  }).format(Number(value));
}
