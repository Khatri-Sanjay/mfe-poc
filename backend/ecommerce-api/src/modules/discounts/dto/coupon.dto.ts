import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, Matches, MaxLength, Min } from 'class-validator';
import { CouponType } from '../enums/coupon-type.enum';

export class CouponResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty()
	code!: string;
	@ApiProperty({ enum: CouponType })
	type!: CouponType;
	@ApiProperty()
	value!: string;
	@ApiProperty({ nullable: true })
	minimumOrderAmount!: string | null;
	@ApiProperty({ nullable: true })
	maximumDiscountAmount!: string | null;
	@ApiProperty({ nullable: true })
	startsAt!: Date | null;
	@ApiProperty({ nullable: true })
	expiresAt!: Date | null;
	@ApiProperty({ nullable: true })
	usageLimit!: number | null;
	@ApiProperty({ nullable: true })
	usageLimitPerUser!: number | null;
	@ApiProperty()
	usageCount!: number;
	@ApiProperty()
	isActive!: boolean;
}

export class CreateCouponDto {
	@ApiProperty()
	@IsString()
	@MaxLength(80)
	code!: string;
	@ApiProperty({ enum: CouponType })
	@IsEnum(CouponType)
	type!: CouponType;
	@ApiProperty()
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	value!: string;
	@ApiPropertyOptional()
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	@IsOptional()
	minimumOrderAmount?: string;
	@ApiPropertyOptional()
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	@IsOptional()
	maximumDiscountAmount?: string;
	@ApiPropertyOptional()
	@IsDateString()
	@IsOptional()
	startsAt?: string;
	@ApiPropertyOptional()
	@IsDateString()
	@IsOptional()
	expiresAt?: string;
	@ApiPropertyOptional()
	@IsInt()
	@Min(1)
	@IsOptional()
	usageLimit?: number;
	@ApiPropertyOptional()
	@IsInt()
	@Min(1)
	@IsOptional()
	usageLimitPerUser?: number;
	@ApiPropertyOptional()
	@IsBoolean()
	@IsOptional()
	isActive?: boolean;
}

export class UpdateCouponDto extends PartialType(CreateCouponDto) {}
