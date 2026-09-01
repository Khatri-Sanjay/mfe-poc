import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AddWishlistItemDto {
	@ApiProperty({ format: 'uuid' })
	@IsUUID()
	productId!: string;
}

export class WishlistItemResponseDto {
	@ApiProperty({ format: 'uuid' })
	productId!: string;
	@ApiProperty()
	name!: string;
	@ApiProperty()
	slug!: string;
	@ApiProperty({ nullable: true })
	imageUrl!: string | null;
}

export class WishlistResponseDto {
	@ApiProperty({ type: [WishlistItemResponseDto] })
	items!: WishlistItemResponseDto[];
}
