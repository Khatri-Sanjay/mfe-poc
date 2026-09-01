import type { ApiResponse, ProductComparison } from './types';

export async function getProductComparison(apiBaseUrl: string, productId: string): Promise<ProductComparison> {
  const baseUrl = apiBaseUrl.replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/product-comparison/${encodeURIComponent(productId)}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Product comparison API returned ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<ProductComparison>;
  return body.data;
}
