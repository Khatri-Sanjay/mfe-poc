import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, IsUrl, IsUUID, MaxLength, Min } from 'class-validator';

export class CreateCategoryDto {
	@ApiProperty({ example: 'Phones' })
	@IsString()
	@MaxLength(160)
	name!: string;

	@ApiPropertyOptional({ example: 'phones' })
	@IsString()
	@MaxLength(180)
	@IsOptional()
	slug?: string;

	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional({ format: 'uuid' })
	@IsUUID()
	@IsOptional()
	parentId?: string;

	@ApiPropertyOptional()
	@IsUrl({ require_tld: false })
	@IsOptional()
	imageUrl?: string;

	@ApiPropertyOptional({ default: true })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;

	@ApiPropertyOptional({ default: 0 })
	@Transform(({ value }: { value: unknown }) => Number(value))
	@IsInt()
	@Min(0)
	@IsOptional()
	sortOrder?: number;
}
