import { PRICE_LENS_API_BASE_URL } from '../config'
import type { ApiResponse, PriceHistory, ProductComparison } from '../types'

function cleanBaseUrl(apiBaseUrl: string): string {
  return apiBaseUrl.replace(/\/$/, '')
}

async function readApiResponse<T>(response: Response): Promise<T> {
  let body: ApiResponse<T> | undefined

  try {
    body = (await response.json()) as ApiResponse<T>
  } catch {
    body = undefined
  }

  if (!response.ok) {
    const fallback =
      response.status === 400
        ? 'The search request was invalid.'
        : response.status === 404
          ? 'No comparable offers were found for this product.'
          : response.status === 429
            ? 'Too many requests. Please wait a moment and try again.'
            : response.status >= 500
              ? 'Price comparison is temporarily unavailable.'
              : 'Unable to load Price Lens data.'
    throw new Error(body?.message || fallback)
  }

  if (!body || typeof body !== 'object' || !('data' in body)) {
    throw new Error('The API returned an unexpected response.')
  }

  return body.data
}

export async function searchProduct(query: string, apiBaseUrl = PRICE_LENS_API_BASE_URL): Promise<ProductComparison> {
  const params = new URLSearchParams({ query })
  const response = await fetch(`${cleanBaseUrl(apiBaseUrl)}/product-comparison/search/items?${params.toString()}`, {
    headers: { Accept: 'application/json' },
  })
  return readApiResponse<ProductComparison>(response)
}

export async function getProductComparison(productId: string, apiBaseUrl = PRICE_LENS_API_BASE_URL): Promise<ProductComparison> {
  const response = await fetch(`${cleanBaseUrl(apiBaseUrl)}/product-comparison/${encodeURIComponent(productId)}`, {
    headers: { Accept: 'application/json' },
  })
  return readApiResponse<ProductComparison>(response)
}

export async function getProduct(productId: string): Promise<ProductComparison> {
  return searchProduct(productId)
}

export async function getProductAnalysis(productId: string): Promise<ProductComparison> {
  return searchProduct(productId)
}

export async function getPriceHistory(productId: string): Promise<PriceHistory> {
  return {
    productId,
    points: [],
  }
}

export const priceLensApi = {
  searchProduct,
  getProduct,
  getProductComparison,
  getProductAnalysis,
  getPriceHistory,
}
