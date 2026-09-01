import { ApiResponse, Product, ProductQuery } from './types';

export async function getProducts(apiBaseUrl: string, query: ProductQuery): Promise<Product[]> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  }

  const url = `${apiBaseUrl.replace(/\/$/, '')}/products?${params.toString()}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Product API returned ${response.status}`);
  }

  const body = (await response.json()) as ApiResponse<Product[]>;
  return body.data;
}
