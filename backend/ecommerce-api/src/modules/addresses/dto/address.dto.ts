import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class AddressResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty()
	firstName!: string;
	@ApiProperty()
	lastName!: string;
	@ApiProperty({ nullable: true })
	company!: string | null;
	@ApiProperty()
	addressLine1!: string;
	@ApiProperty({ nullable: true })
	addressLine2!: string | null;
	@ApiProperty()
	city!: string;
	@ApiProperty({ nullable: true })
	state!: string | null;
	@ApiProperty()
	postalCode!: string;
	@ApiProperty()
	countryCode!: string;
	@ApiProperty({ nullable: true })
	phone!: string | null;
	@ApiProperty()
	isDefaultShipping!: boolean;
	@ApiProperty()
	isDefaultBilling!: boolean;
}

export class CreateAddressDto {
	@ApiProperty()
	@IsString()
	@MaxLength(100)
	firstName!: string;
	@ApiProperty()
	@IsString()
	@MaxLength(100)
	lastName!: string;
	@ApiPropertyOptional()
	@IsString()
	@MaxLength(160)
	@IsOptional()
	company?: string;
	@ApiProperty()
	@IsString()
	@MaxLength(255)
	addressLine1!: string;
	@ApiPropertyOptional()
	@IsString()
	@MaxLength(255)
	@IsOptional()
	addressLine2?: string;
	@ApiProperty()
	@IsString()
	@MaxLength(120)
	city!: string;
	@ApiPropertyOptional()
	@IsString()
	@MaxLength(120)
	@IsOptional()
	state?: string;
	@ApiProperty()
	@IsString()
	@MaxLength(40)
	postalCode!: string;
	@ApiProperty({ example: 'AU' })
	@Matches(/^[A-Z]{2}$/)
	countryCode!: string;
	@ApiPropertyOptional()
	@IsString()
	@MaxLength(30)
	@IsOptional()
	phone?: string;
	@ApiPropertyOptional()
	@IsBoolean()
	@IsOptional()
	isDefaultShipping?: boolean;
	@ApiPropertyOptional()
	@IsBoolean()
	@IsOptional()
	isDefaultBilling?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
