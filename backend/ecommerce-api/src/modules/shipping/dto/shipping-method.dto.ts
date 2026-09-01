import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';

export class ShippingMethodResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty()
	name!: string;
	@ApiProperty()
	code!: string;
	@ApiProperty({ nullable: true })
	description!: string | null;
	@ApiProperty()
	price!: string;
	@ApiProperty()
	currency!: string;
	@ApiProperty()
	estimatedMinDays!: number;
	@ApiProperty()
	estimatedMaxDays!: number;
	@ApiProperty()
	isActive!: boolean;
}

export class CreateShippingMethodDto {
	@ApiProperty()
	@IsString()
	@MaxLength(160)
	name!: string;
	@ApiProperty()
	@IsString()
	@MaxLength(80)
	code!: string;
	@ApiPropertyOptional()
	@IsString()
	@MaxLength(500)
	@IsOptional()
	description?: string;
	@ApiProperty({ example: '10.00' })
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	price!: string;
	@ApiPropertyOptional({ example: 'AUD' })
	@Matches(/^[A-Z]{3}$/)
	@IsOptional()
	currency?: string;
	@ApiProperty()
	@IsInt()
	@Min(0)
	estimatedMinDays!: number;
	@ApiProperty()
	@IsInt()
	@Min(0)
	estimatedMaxDays!: number;
	@ApiPropertyOptional()
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}

export class UpdateShippingMethodDto extends PartialType(CreateShippingMethodDto) {}
