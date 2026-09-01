import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { Product } from '../../products/entities/product.entity';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { AddWishlistItemDto, WishlistResponseDto } from '../dto/wishlist.dto';
import { WishlistItem } from '../entities/wishlist-item.entity';

const mapWishlist = (items: WishlistItem[]): WishlistResponseDto => ({
	items: items.map((item) => ({
		productId: item.product.id,
		name: item.product.name,
		slug: item.product.slug,
		imageUrl: item.product.images?.find((image) => image.isPrimary)?.url ?? item.product.images?.[0]?.url ?? null
	}))
});

@Injectable()
export class WishlistsService {
	constructor(
		@InjectRepository(WishlistItem)
		private readonly repository: Repository<WishlistItem>,
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>
	) {}

	async list(userId: string): Promise<WishlistResponseDto> {
		return mapWishlist(
			await this.repository.find({
				where: { userId },
				relations: { product: { images: true } },
				order: { createdAt: 'DESC' }
			})
		);
	}

	async add(userId: string, dto: AddWishlistItemDto): Promise<WishlistResponseDto> {
		const product = await this.productRepository.findOne({
			where: { id: dto.productId, status: ProductStatus.Active }
		});
		if (!product) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product was not found'
			});
		}

		const existing = await this.repository.findOne({
			where: { userId, productId: dto.productId }
		});
		if (existing) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Product is already in wishlist'
			});
		}

		await this.repository.save(this.repository.create({ userId, productId: dto.productId }));
		return this.list(userId);
	}

	async remove(userId: string, productId: string): Promise<WishlistResponseDto> {
		const item = await this.repository.findOne({
			where: { userId, productId }
		});
		if (!item) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Wishlist item was not found'
			});
		}
		await this.repository.remove(item);
		return this.list(userId);
	}

	async clear(userId: string): Promise<{ status: string }> {
		await this.repository.delete({ userId });
		return { status: 'cleared' };
	}
}
