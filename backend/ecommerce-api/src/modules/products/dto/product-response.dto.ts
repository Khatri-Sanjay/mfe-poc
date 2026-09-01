import { ApiProperty } from '@nestjs/swagger';
import { BrandResponseDto } from '../../brands/dto/brand-response.dto';
import { CategoryResponseDto } from '../../categories/dto/category-response.dto';
import { ProductStatus } from '../enums/product-status.enum';

export class ProductImageResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	url!: string;

	@ApiProperty({ nullable: true })
	altText!: string | null;

	@ApiProperty()
	sortOrder!: number;

	@ApiProperty()
	isPrimary!: boolean;
}

export class ProductVariantResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty({ example: 'IPHONE-BLACK-128' })
	sku!: string;

	@ApiProperty({ nullable: true })
	barcode!: string | null;

	@ApiProperty()
	name!: string;

	@ApiProperty({ example: { color: 'Black', storage: '128GB' } })
	options!: Record<string, string>;

	@ApiProperty({ example: '999.00' })
	price!: string;

	@ApiProperty({ nullable: true, example: '1099.00' })
	compareAtPrice!: string | null;

	@ApiProperty({ example: 'AUD' })
	currency!: string;

	@ApiProperty()
	isActive!: boolean;

	@ApiProperty({ example: 10 })
	quantityAvailable!: number;
}

export class ProductResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	name!: string;

	@ApiProperty()
	slug!: string;

	@ApiProperty({ nullable: true })
	description!: string | null;

	@ApiProperty({ nullable: true })
	shortDescription!: string | null;

	@ApiProperty({ enum: ProductStatus })
	status!: ProductStatus;

	@ApiProperty({ type: BrandResponseDto, nullable: true })
	brand!: BrandResponseDto | null;

	@ApiProperty({ type: [CategoryResponseDto] })
	categories!: CategoryResponseDto[];

	@ApiProperty({ type: [ProductImageResponseDto] })
	images!: ProductImageResponseDto[];

	@ApiProperty({ type: [ProductVariantResponseDto] })
	variants!: ProductVariantResponseDto[];

	@ApiProperty({ example: 4.5 })
	averageRating!: number;

	@ApiProperty({ example: 12 })
	reviewCount!: number;
}
