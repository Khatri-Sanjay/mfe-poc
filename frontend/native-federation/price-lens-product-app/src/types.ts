export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
  path: string;
  requestId: string;
}

export interface ComparedProduct {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  variant?: string;
  storage?: string;
  color?: string;
  sku?: string;
  barcode?: string;
  ourPrice?: number;
  currency: string;
}

export interface ProductComparisonMarket {
  lowestPrice: number;
  lowestPriceUsd: number;
  lowestPriceNpr: number;
  highestPrice: number;
  highestPriceUsd: number;
  highestPriceNpr: number;
  averagePrice: number;
  averagePriceUsd: number;
  averagePriceNpr: number;
  differenceFromLowest: number;
  potentialSaving: number;
}

export interface ProductComparisonOffer {
  store: string;
  title: string;
  region?: string;
  countryCode?: string;
  brand?: string;
  model?: string;
  variant?: string;
  storage?: string;
  color?: string;
  price: number;
  priceUsd: number;
  priceNpr: number;
  shippingCost?: number;
  shippingCostUsd: number;
  shippingCostNpr: number;
  totalPrice: number;
  totalPriceUsd: number;
  totalPriceNpr: number;
  currency: string;
  availability?: string;
  rating?: number;
  url: string;
  isCheapest: boolean;
}

export interface ProductComparisonRecommendations {
  cheapest?: string;
  bestRated?: string;
  bestValue?: string;
}

export interface ProductComparison {
  product: ComparedProduct;
  market: ProductComparisonMarket;
  offers: ProductComparisonOffer[];
  recommendations: ProductComparisonRecommendations;
}
