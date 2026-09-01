import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ComparedProductDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

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

	@ApiPropertyOptional()
	sku?: string;

	@ApiPropertyOptional()
	barcode?: string;

	@ApiProperty()
	ourPrice!: number;

	@ApiProperty()
	currency!: string;
}

export class ProductComparisonMarketDto {
	@ApiProperty()
	lowestPrice!: number;

	@ApiProperty()
	highestPrice!: number;

	@ApiProperty()
	averagePrice!: number;

	@ApiProperty()
	differenceFromLowest!: number;

	@ApiProperty()
	potentialSaving!: number;
}

export class ProductComparisonOfferDto {
	@ApiProperty()
	store!: string;

	@ApiProperty()
	title!: string;

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

	@ApiProperty()
	price!: number;

	@ApiPropertyOptional()
	shippingCost?: number;

	@ApiProperty()
	totalPrice!: number;

	@ApiProperty()
	currency!: string;

	@ApiPropertyOptional()
	availability?: string;

	@ApiPropertyOptional()
	rating?: number;

	@ApiProperty()
	url!: string;

	@ApiProperty()
	isCheapest!: boolean;
}

export class ProductComparisonRecommendationsDto {
	@ApiPropertyOptional()
	cheapest?: string;

	@ApiPropertyOptional()
	bestRated?: string;

	@ApiPropertyOptional()
	bestValue?: string;
}

export class ProductComparisonResponseDto {
	@ApiProperty({ type: ComparedProductDto })
	product!: ComparedProductDto;

	@ApiProperty({ type: ProductComparisonMarketDto })
	market!: ProductComparisonMarketDto;

	@ApiProperty({ type: [ProductComparisonOfferDto] })
	offers!: ProductComparisonOfferDto[];

	@ApiProperty({ type: ProductComparisonRecommendationsDto })
	recommendations!: ProductComparisonRecommendationsDto;
}
