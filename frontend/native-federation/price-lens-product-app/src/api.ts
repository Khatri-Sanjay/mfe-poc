import type { ApiResponse, ProductComparison } from './types';

function cleanBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/$/, '');
}

export async function searchProductComparison(apiBaseUrl: string, query: string): Promise<ProductComparison> {
  const baseUrl = cleanBaseUrl(apiBaseUrl);
  const params = new URLSearchParams({ query });
  const response = await fetch(`${baseUrl}/product-comparison/search/items?${params.toString()}`, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Product search API returned ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<ProductComparison>;
  return body.data;
}
