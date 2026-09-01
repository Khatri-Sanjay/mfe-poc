import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationQueryDto {
	@ApiPropertyOptional({ default: 1, minimum: 1 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@IsOptional()
	page = 1;

	@ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
	@Type(() => Number)
	@IsInt()
	@Min(1)
	@Max(100)
	@IsOptional()
	limit = 20;

	@ApiPropertyOptional({ example: 'phone' })
	@Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
	@IsString()
	@IsOptional()
	search?: string;

	@ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
	@IsIn(['asc', 'desc'])
	@IsOptional()
	sortOrder: 'asc' | 'desc' = 'desc';
}
