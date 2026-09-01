import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateBrandDto {
	@ApiProperty({ example: 'Apple' })
	@IsString()
	@MaxLength(160)
	name!: string;

	@ApiPropertyOptional({ example: 'apple' })
	@IsString()
	@MaxLength(180)
	@IsOptional()
	slug?: string;

	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	description?: string;

	@ApiPropertyOptional()
	@IsUrl({ require_tld: false })
	@IsOptional()
	logoUrl?: string;

	@ApiPropertyOptional()
	@IsUrl({ require_tld: false })
	@IsOptional()
	websiteUrl?: string;

	@ApiPropertyOptional({ default: true })
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}
