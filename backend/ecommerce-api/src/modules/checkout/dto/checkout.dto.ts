import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CheckoutQuoteDto {
	@ApiPropertyOptional({ format: 'uuid' })
	@IsUUID()
	@IsOptional()
	shippingMethodId?: string;
}

export class CheckoutDto {
	@ApiProperty({ format: 'uuid' })
	@IsUUID()
	shippingAddressId!: string;
	@ApiProperty({ format: 'uuid' })
	@IsUUID()
	billingAddressId!: string;
	@ApiProperty({ format: 'uuid' })
	@IsUUID()
	shippingMethodId!: string;
}
