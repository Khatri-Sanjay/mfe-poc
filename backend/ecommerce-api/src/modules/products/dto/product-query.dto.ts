import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class ProductQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ example: 'phones' })
	@IsString()
	@IsOptional()
	category?: string;

	@ApiPropertyOptional({ example: 'apple' })
	@IsString()
	@IsOptional()
	brand?: string;

	@ApiPropertyOptional({ example: 500 })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@IsOptional()
	minPrice?: number;

	@ApiPropertyOptional({ example: 2000 })
	@Type(() => Number)
	@IsNumber({ maxDecimalPlaces: 2 })
	@Min(0)
	@IsOptional()
	maxPrice?: number;

	@ApiPropertyOptional({ example: true })
	@Transform(({ value }: { value: unknown }) => value === true || value === 'true')
	@IsBoolean()
	@IsOptional()
	inStock?: boolean;

	@ApiPropertyOptional({
		enum: ['createdAt', 'name', 'price'],
		default: 'createdAt'
	})
	@IsIn(['createdAt', 'name', 'price'])
	@IsOptional()
	sortBy: 'createdAt' | 'name' | 'price' = 'createdAt';
}
