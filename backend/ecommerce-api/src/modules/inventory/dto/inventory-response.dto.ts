import { ApiProperty } from '@nestjs/swagger';

export class InventoryResponseDto {
	@ApiProperty()
	id!: string;

	@ApiProperty()
	variantId!: string;

	@ApiProperty()
	sku!: string;

	@ApiProperty()
	productName!: string;

	@ApiProperty()
	quantityOnHand!: number;

	@ApiProperty()
	quantityReserved!: number;

	@ApiProperty()
	quantityAvailable!: number;

	@ApiProperty()
	reorderLevel!: number;
}
