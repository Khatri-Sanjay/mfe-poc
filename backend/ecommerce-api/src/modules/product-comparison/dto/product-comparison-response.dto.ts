import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MoneyDto {
	@ApiProperty()
	amount!: number;

	@ApiProperty()
	currency!: string;
}

export class ConvertedPricingDto {
	@ApiProperty()
	currency!: string;

	@ApiProperty()
	productPrice!: number;

	@ApiProperty()
	shipping!: number;

	@ApiProperty()
	total!: number;
}

export class OfferPricingDto {
	@ApiProperty({ type: MoneyDto })
	original!: MoneyDto;

	@ApiProperty({ type: MoneyDto })
	shipping!: MoneyDto;

	@ApiProperty({ type: MoneyDto })
	total!: MoneyDto;

	@ApiProperty({ type: ConvertedPricingDto })
	converted!: ConvertedPricingDto;
}

export class ComparedProductDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiPropertyOptional()
	brand?: string;

	@ApiPropertyOptional()
	category?: string;

	@ApiPropertyOptional()
	model?: string;

	@ApiPropertyOptional()
	variant?: string;

	@ApiPropertyOptional()
	storage?: string;

	@ApiPropertyOptional()
	color?: string;

	@ApiPropertyOptional()
	sku?: string;

	@ApiPropertyOptional()
	barcode?: string;

	@ApiPropertyOptional()
	ourPrice?: number;

	@ApiPropertyOptional()
	imageUrl?: string;

	@ApiProperty()
	currency!: string;
}

export class ProductComparisonSummaryDto {
	@ApiProperty()
	currency!: string;

	@ApiProperty()
	lowestPrice!: number;

	@ApiProperty()
	averagePrice!: number;

	@ApiProperty()
	highestPrice!: number;

	@ApiProperty()
	potentialSavingVsAverage!: number;

	@ApiProperty()
	maxPotentialSaving!: number;

	@ApiProperty()
	offersCount!: number;

	@ApiProperty()
	availableOffersCount!: number;
}

export class DealScoreBreakdownDto {
	@ApiProperty()
	price!: number;

	@ApiProperty()
	shipping!: number;

	@ApiPropertyOptional()
	rating?: number;

	@ApiProperty()
	availability!: number;

	@ApiProperty()
	regionalAvailability!: number;
}

export class DealScoreDto {
	@ApiProperty()
	score!: number;

	@ApiProperty()
	label!: string;

	@ApiProperty({ type: DealScoreBreakdownDto })
	breakdown!: DealScoreBreakdownDto;
}

export class OfferMatchDto {
	@ApiProperty()
	confidence!: number;

	@ApiProperty()
	status!: 'HIGH' | 'MEDIUM' | 'LOW';

	@ApiProperty({ type: [String] })
	warnings!: string[];
}

export class ProductComparisonOfferDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	store!: string;

	@ApiProperty()
	title!: string;

	@ApiPropertyOptional()
	region?: string;

	@ApiPropertyOptional()
	countryCode?: string;

	@ApiPropertyOptional()
	country?: string;

	@ApiPropertyOptional()
	brand?: string;

	@ApiPropertyOptional()
	model?: string;

	@ApiPropertyOptional()
	variant?: string;

	@ApiPropertyOptional()
	storage?: string;

	@ApiPropertyOptional()
	color?: string;

	@ApiProperty({ type: OfferPricingDto })
	pricing!: OfferPricingDto;

	@ApiProperty()
	price!: number;

	@ApiProperty()
	priceUsd!: number;

	@ApiProperty()
	priceNpr!: number;

	@ApiProperty()
	shippingCost!: number;

	@ApiProperty()
	shippingCostUsd!: number;

	@ApiProperty()
	shippingCostNpr!: number;

	@ApiProperty()
	totalPrice!: number;

	@ApiProperty()
	totalPriceUsd!: number;

	@ApiProperty()
	totalPriceNpr!: number;

	@ApiProperty()
	currency!: string;

	@ApiPropertyOptional()
	availability?: string;

	@ApiPropertyOptional()
	rating?: number;

	@ApiProperty()
	url!: string;

	@ApiPropertyOptional()
	imageUrl?: string;

	@ApiProperty()
	isCheapest!: boolean;

	@ApiProperty({ type: DealScoreDto })
	dealScore!: DealScoreDto;

	@ApiProperty({ type: OfferMatchDto })
	match!: OfferMatchDto;

	@ApiProperty({ type: [String] })
	reasons!: string[];

	@ApiProperty({ type: [String] })
	warnings!: string[];
}

export class RecommendationDto {
	@ApiProperty()
	store!: string;

	@ApiProperty()
	offerId!: string;

	@ApiProperty()
	title!: string;

	@ApiProperty()
	totalPrice!: number;

	@ApiProperty()
	currency!: string;

	@ApiProperty()
	score!: number;

	@ApiPropertyOptional()
	rating?: number;

	@ApiPropertyOptional()
	region?: string;

	@ApiPropertyOptional()
	countryCode?: string;

	@ApiProperty()
	url!: string;

	@ApiProperty({ type: [String] })
	reason!: string[];

	@ApiProperty({ type: [String] })
	warnings!: string[];
}

export class ProductComparisonRecommendationsDto {
	@ApiPropertyOptional({ type: RecommendationDto })
	bestOverall?: RecommendationDto;

	@ApiPropertyOptional({ type: RecommendationDto })
	cheapest?: RecommendationDto;

	@ApiPropertyOptional({ type: RecommendationDto })
	bestRated?: RecommendationDto;

	@ApiPropertyOptional({ type: RecommendationDto })
	bestLocal?: RecommendationDto;

	@ApiPropertyOptional({ type: RecommendationDto })
	bestShipping?: RecommendationDto;

	@ApiPropertyOptional()
	bestValue?: string;
}

export class ProductComparisonMarketDto {
	@ApiProperty()
	lowestPrice!: number;

	@ApiProperty()
	lowestPriceUsd!: number;

	@ApiProperty()
	lowestPriceNpr!: number;

	@ApiProperty()
	highestPrice!: number;

	@ApiProperty()
	highestPriceUsd!: number;

	@ApiProperty()
	highestPriceNpr!: number;

	@ApiProperty()
	averagePrice!: number;

	@ApiProperty()
	averagePriceUsd!: number;

	@ApiProperty()
	averagePriceNpr!: number;

	@ApiProperty()
	differenceFromLowest!: number;

	@ApiProperty()
	potentialSaving!: number;
}

export class PriceRangeDto {
	@ApiProperty()
	min!: number;

	@ApiProperty()
	max!: number;
}

export class PriceAnalysisDto {
	@ApiProperty()
	marketPosition!: string;

	@ApiProperty()
	percentBelowAverage!: number;

	@ApiProperty()
	percentAboveLowest!: number;

	@ApiProperty()
	recommendation!: 'BUY' | 'COMPARE' | 'WAIT';

	@ApiProperty({ type: PriceRangeDto })
	priceRange!: PriceRangeDto;
}

export class RegionalAnalysisDto {
	@ApiProperty()
	countryCode!: string;

	@ApiProperty()
	country!: string;

	@ApiProperty()
	lowestPrice!: number;

	@ApiProperty()
	averagePrice!: number;

	@ApiProperty()
	offerCount!: number;
}

export class RiskWarningDto {
	@ApiProperty()
	type!: string;

	@ApiProperty()
	severity!: 'low' | 'medium' | 'high';

	@ApiProperty()
	message!: string;
}

export class RiskAnalysisDto {
	@ApiProperty()
	hasWarnings!: boolean;

	@ApiProperty({ type: [RiskWarningDto] })
	warnings!: RiskWarningDto[];
}

export class ShoppingReportDto {
	@ApiProperty()
	headline!: string;

	@ApiProperty()
	recommendation!: 'BUY' | 'COMPARE' | 'WAIT';

	@ApiProperty()
	confidence!: number;

	@ApiProperty()
	summary!: string;

	@ApiProperty({ type: [String] })
	highlights!: string[];

	@ApiProperty({ type: [String] })
	warnings!: string[];
}

export class ProductComparisonMetadataDto {
	@ApiProperty()
	generatedAt!: string;

	@ApiProperty()
	preferredCountryCode!: string;

	@ApiProperty()
	targetCurrency!: string;

	@ApiProperty()
	sourceCount!: number;

	@ApiProperty()
	historyAvailable!: boolean;
}

export class ProductComparisonResponseDto {
	@ApiProperty({ type: ComparedProductDto })
	product!: ComparedProductDto;

	@ApiProperty({ type: ProductComparisonSummaryDto })
	summary!: ProductComparisonSummaryDto;

	@ApiProperty({ type: ProductComparisonRecommendationsDto })
	recommendations!: ProductComparisonRecommendationsDto;

	@ApiProperty({ type: PriceAnalysisDto })
	priceAnalysis!: PriceAnalysisDto;

	@ApiProperty({ type: [RegionalAnalysisDto] })
	regionalAnalysis!: RegionalAnalysisDto[];

	@ApiProperty({ type: [ProductComparisonOfferDto] })
	offers!: ProductComparisonOfferDto[];

	@ApiProperty({ type: RiskAnalysisDto })
	riskAnalysis!: RiskAnalysisDto;

	@ApiProperty({ type: ShoppingReportDto })
	report!: ShoppingReportDto;

	@ApiProperty({ type: ProductComparisonMetadataDto })
	metadata!: ProductComparisonMetadataDto;

	@ApiProperty({ type: ProductComparisonMarketDto })
	market!: ProductComparisonMarketDto;
}
