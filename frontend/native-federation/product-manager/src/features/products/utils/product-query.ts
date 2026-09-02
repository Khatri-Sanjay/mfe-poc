import type { ProductQuery, ProductSortBy, SortOrder } from '../types/product.types';

export const DEFAULT_QUERY: Required<Pick<ProductQuery, 'page' | 'limit' | 'sortBy' | 'sortOrder'>> = {
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

export function queryFromSearchParams(searchParams: URLSearchParams): ProductQuery {
  const minPriceRaw = searchParams.get('minPrice');
  const maxPriceRaw = searchParams.get('maxPrice');
  const stockRaw = searchParams.get('inStock');

  return {
    page: Math.max(1, Number(searchParams.get('page')) || DEFAULT_QUERY.page),
    limit: Math.min(100, Math.max(1, Number(searchParams.get('limit')) || DEFAULT_QUERY.limit)),
    search: searchParams.get('search') || undefined,
    category: searchParams.get('category') || undefined,
    brand: searchParams.get('brand') || undefined,
    minPrice: minPriceRaw ? Number(minPriceRaw) : undefined,
    maxPrice: maxPriceRaw ? Number(maxPriceRaw) : undefined,
    inStock: stockRaw === 'true' ? true : stockRaw === 'false' ? false : undefined,
    sortBy: (searchParams.get('sortBy') as ProductSortBy | null) ?? DEFAULT_QUERY.sortBy,
    sortOrder: (searchParams.get('sortOrder') as SortOrder | null) ?? DEFAULT_QUERY.sortOrder,
  };
}

export function queryToSearchParams(query: ProductQuery) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  return params;
}
