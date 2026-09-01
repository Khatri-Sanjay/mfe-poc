import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
	ArrayUnique,
	IsArray,
	IsBoolean,
	IsEnum,
	IsObject,
	IsOptional,
	IsString,
	IsUrl,
	IsUUID,
	Matches,
	MaxLength,
	Min,
	ValidateNested,
	IsInt
} from 'class-validator';
import { ProductStatus } from '../enums/product-status.enum';

export class CreateProductImageDto {
	@ApiProperty()
	@IsUrl({ require_tld: false })
	url!: string;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(255)
	@IsOptional()
	altText?: string;

	@ApiPropertyOptional({ default: 0 })
	@IsInt()
	@Min(0)
	@IsOptional()
	sortOrder?: number;

	@ApiPropertyOptional({ default: false })
	@IsBoolean()
	@IsOptional()
	isPrimary?: boolean;
}

export class CreateProductVariantDto {
	@ApiProperty({ example: 'SKU-001' })
	@IsString()
	@MaxLength(120)
	sku!: string;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(120)
	@IsOptional()
	barcode?: string;

	@ApiProperty({ example: 'Default' })
	@IsString()
	@MaxLength(180)
	name!: string;

	@ApiPropertyOptional({ example: { color: 'Black' } })
	@IsObject()
	@IsOptional()
	options?: Record<string, string>;

	@ApiProperty({ example: '100.00' })
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	price!: string;

	@ApiPropertyOptional({ example: '120.00' })
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	@IsOptional()
	compareAtPrice?: string;

	@ApiPropertyOptional({ example: '70.00' })
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	@IsOptional()
	costPrice?: string;

	@ApiPropertyOptional({ example: 'AUD' })
	@Matches(/^[A-Z]{3}$/)
	@IsOptional()
	currency?: string;

	@ApiPropertyOptional({ example: '1.250' })
	@Matches(/^\d{1,7}(\.\d{1,3})?$/)
	@IsOptional()
	weight?: string;

	@ApiPropertyOptional({ default: true })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@ApiPropertyOptional({ default: 0 })
	@IsInt()
	@Min(0)
	@IsOptional()
	quantityOnHand?: number;
}

export class CreateProductDto {
	@ApiProperty()
	@IsString()
	@MaxLength(220)
	name!: string;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(240)
	@IsOptional()
	slug?: string;

	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(500)
	@IsOptional()
	shortDescription?: string;

	@ApiPropertyOptional({ format: 'uuid' })
	@IsUUID()
	@IsOptional()
	brandId?: string;

	@ApiPropertyOptional({ type: [String], format: 'uuid' })
	@IsArray()
	@ArrayUnique()
	@IsUUID(undefined, { each: true })
	@IsOptional()
	categoryIds?: string[];

	@ApiPropertyOptional({ enum: ProductStatus, default: ProductStatus.Draft })
	@IsEnum(ProductStatus)
	@IsOptional()
	status?: ProductStatus;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(255)
	@IsOptional()
	seoTitle?: string;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(500)
	@IsOptional()
	seoDescription?: string;

	@ApiPropertyOptional({ type: [CreateProductImageDto] })
	@ValidateNested({ each: true })
	@Type(() => CreateProductImageDto)
	@IsArray()
	@IsOptional()
	images?: CreateProductImageDto[];

	@ApiProperty({ type: [CreateProductVariantDto] })
	@ValidateNested({ each: true })
	@Type(() => CreateProductVariantDto)
	@IsArray()
	variants!: CreateProductVariantDto[];
}
