export interface ApiResponse<T> {
  success: boolean
  statusCode: number
  message: string
  data: T
  timestamp: string
  path: string
  requestId: string
}

export interface ComparedProduct {
  id: string
  name: string
  brand?: string
  category?: string
  model?: string
  variant?: string
  storage?: string
  color?: string
  sku?: string
  barcode?: string
  ourPrice?: number
  imageUrl?: string
  currency: string
}

export interface Money {
  amount: number
  currency: string
}

export interface OfferPricing {
  original: Money
  shipping: Money
  total: Money
  converted: {
    currency: string
    productPrice: number
    shipping: number
    total: number
  }
}

export interface DealScore {
  score: number
  label: string
  breakdown: {
    price: number
    shipping: number
    rating?: number
    availability: number
    regionalAvailability: number
  }
}

export interface OfferMatch {
  confidence: number
  status: 'HIGH' | 'MEDIUM' | 'LOW'
  warnings: string[]
}

export interface ProductComparisonOffer {
  id: string
  store: string
  title: string
  region?: string
  countryCode?: string
  country?: string
  brand?: string
  model?: string
  variant?: string
  storage?: string
  color?: string
  pricing: OfferPricing
  price: number
  priceUsd: number
  priceNpr: number
  shippingCost: number
  shippingCostUsd: number
  shippingCostNpr: number
  totalPrice: number
  totalPriceUsd: number
  totalPriceNpr: number
  currency: string
  availability?: string
  rating?: number
  url: string
  imageUrl?: string
  isCheapest: boolean
  dealScore: DealScore
  match: OfferMatch
  reasons: string[]
  warnings: string[]
}

export interface Recommendation {
  store: string
  offerId: string
  title: string
  totalPrice: number
  currency: string
  score: number
  rating?: number
  region?: string
  countryCode?: string
  url: string
  reason: string[]
  warnings: string[]
}

export interface ProductComparisonRecommendations {
  bestOverall?: Recommendation
  cheapest?: Recommendation
  bestRated?: Recommendation
  bestLocal?: Recommendation
  bestShipping?: Recommendation
  bestValue?: string
}

export interface ProductComparisonSummary {
  currency: string
  lowestPrice: number
  averagePrice: number
  highestPrice: number
  potentialSavingVsAverage: number
  maxPotentialSaving: number
  offersCount: number
  availableOffersCount: number
}

export interface PriceAnalysis {
  marketPosition: string
  percentBelowAverage: number
  percentAboveLowest: number
  recommendation: 'BUY' | 'COMPARE' | 'WAIT'
  priceRange: {
    min: number
    max: number
  }
}

export interface RegionalAnalysis {
  countryCode: string
  country: string
  lowestPrice: number
  averagePrice: number
  offerCount: number
}

export interface RiskWarning {
  type: string
  severity: 'low' | 'medium' | 'high'
  message: string
}

export interface ShoppingReport {
  headline: string
  recommendation: 'BUY' | 'COMPARE' | 'WAIT'
  confidence: number
  summary: string
  highlights: string[]
  warnings: string[]
}

export interface ProductComparison {
  product: ComparedProduct
  summary: ProductComparisonSummary
  recommendations: ProductComparisonRecommendations
  priceAnalysis: PriceAnalysis
  regionalAnalysis: RegionalAnalysis[]
  offers: ProductComparisonOffer[]
  riskAnalysis: {
    hasWarnings: boolean
    warnings: RiskWarning[]
  }
  report: ShoppingReport
  metadata: {
    generatedAt: string
    preferredCountryCode: string
    targetCurrency: string
    sourceCount: number
    historyAvailable: boolean
  }
}

export interface PriceHistory {
  productId: string
  points: Array<{ date: string; price: number; currency: string }>
}
