import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class CartItemRequestDto {
	@ApiProperty({ format: 'uuid' })
	@IsUUID()
	variantId!: string;

	@ApiProperty({ example: 2 })
	@IsInt()
	@Min(1)
	quantity!: number;
}

export class UpdateCartItemDto {
	@ApiProperty({ example: 2 })
	@IsInt()
	@Min(1)
	quantity!: number;
}

export class ApplyCouponDto {
	@ApiProperty({ example: 'SAVE10' })
	@IsString()
	code!: string;
}

export class CartResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty({ type: 'array' })
	items!: unknown[];
	@ApiProperty()
	subtotal!: string;
	@ApiProperty()
	discountTotal!: string;
	@ApiProperty()
	shippingTotal!: string;
	@ApiProperty()
	taxTotal!: string;
	@ApiProperty()
	grandTotal!: string;
	@ApiProperty()
	currency!: string;
	@ApiProperty()
	itemCount!: number;
}
