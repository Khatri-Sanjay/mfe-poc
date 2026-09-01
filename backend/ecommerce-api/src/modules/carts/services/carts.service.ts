import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { centsToMoney, multiplyMoney, toCents } from '../../../common/utils/money.util';
import { CouponsService } from '../../discounts/services/coupons.service';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { ApplyCouponDto, CartItemRequestDto, CartResponseDto, UpdateCartItemDto } from '../dto/cart.dto';
import { CartItem } from '../entities/cart-item.entity';
import { Cart } from '../entities/cart.entity';

interface CartItemResponse {
	id: string;
	variantId: string;
	productId: string;
	productName: string;
	slug: string;
	sku: string;
	imageUrl: string | null;
	options: Record<string, string>;
	unitPrice: string;
	quantity: number;
	lineTotal: string;
}

@Injectable()
export class CartsService {
	constructor(
		@InjectRepository(Cart) private readonly cartRepository: Repository<Cart>,
		@InjectRepository(CartItem)
		private readonly itemRepository: Repository<CartItem>,
		@InjectRepository(ProductVariant)
		private readonly variantRepository: Repository<ProductVariant>,
		@InjectRepository(InventoryItem)
		private readonly inventoryRepository: Repository<InventoryItem>,
		private readonly couponsService: CouponsService
	) {}

	async getCart(userId: string): Promise<CartResponseDto> {
		return this.mapCart(await this.getOrCreateCart(userId));
	}

	async addItem(userId: string, dto: CartItemRequestDto): Promise<CartResponseDto> {
		const cart = await this.getOrCreateCart(userId);
		await this.validateVariant(dto.variantId, dto.quantity);

		const existing = cart.items.find((item) => item.variantId === dto.variantId);
		if (existing) {
			existing.quantity += dto.quantity;
			await this.validateVariant(dto.variantId, existing.quantity);
			await this.itemRepository.save(existing);
		} else {
			await this.itemRepository.save(
				this.itemRepository.create({
					cartId: cart.id,
					variantId: dto.variantId,
					quantity: dto.quantity
				})
			);
		}

		return this.getCart(userId);
	}

	async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto): Promise<CartResponseDto> {
		const cart = await this.getOrCreateCart(userId);
		const item = cart.items.find((cartItem) => cartItem.id === itemId);
		if (!item) {
			throw new NotFoundException({
				errorCode: ErrorCode.CartItemNotFound,
				message: 'Cart item was not found'
			});
		}
		await this.validateVariant(item.variantId, dto.quantity);
		item.quantity = dto.quantity;
		await this.itemRepository.save(item);
		return this.getCart(userId);
	}

	async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
		const cart = await this.getOrCreateCart(userId);
		const item = cart.items.find((cartItem) => cartItem.id === itemId);
		if (!item) {
			throw new NotFoundException({
				errorCode: ErrorCode.CartItemNotFound,
				message: 'Cart item was not found'
			});
		}
		await this.itemRepository.remove(item);
		return this.getCart(userId);
	}

	async clear(userId: string): Promise<{ status: string }> {
		const cart = await this.getOrCreateCart(userId);
		await this.itemRepository.delete({ cartId: cart.id });
		cart.couponId = null;
		await this.cartRepository.save(cart);
		return { status: 'cleared' };
	}

	async applyCoupon(userId: string, dto: ApplyCouponDto): Promise<CartResponseDto> {
		const cart = await this.getOrCreateCart(userId);
		const subtotalCents = this.calculateSubtotalCents(cart);
		const couponCalculation = await this.couponsService.calculate(dto.code, subtotalCents);
		cart.couponId = couponCalculation.coupon.id;
		await this.cartRepository.save(cart);
		return this.getCart(userId);
	}

	async removeCoupon(userId: string): Promise<CartResponseDto> {
		const cart = await this.getOrCreateCart(userId);
		cart.couponId = null;
		await this.cartRepository.save(cart);
		return this.getCart(userId);
	}

	async getCartEntity(userId: string): Promise<Cart> {
		return this.getOrCreateCart(userId);
	}

	async emptyCart(cartId: string): Promise<void> {
		await this.itemRepository.delete({ cartId });
		await this.cartRepository.update({ id: cartId }, { couponId: null });
	}

	private async getOrCreateCart(userId: string): Promise<Cart> {
		const existing = await this.cartRepository.findOne({
			where: { userId },
			relations: {
				coupon: true,
				items: {
					variant: {
						product: { images: true }
					}
				}
			},
			order: { items: { createdAt: 'ASC' } }
		});
		if (existing) {
			return existing;
		}

		const cart = await this.cartRepository.save(this.cartRepository.create({ userId }));
		cart.items = [];
		return cart;
	}

	private async validateVariant(variantId: string, requestedQuantity: number): Promise<void> {
		const variant = await this.variantRepository.findOne({
			where: { id: variantId },
			relations: { product: true }
		});
		if (!variant || !variant.isActive || variant.product.status !== ProductStatus.Active) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product variant was not found'
			});
		}

		const inventory = await this.inventoryRepository.findOne({
			where: { variantId }
		});
		const available = (inventory?.quantityOnHand ?? 0) - (inventory?.quantityReserved ?? 0);
		if (available < requestedQuantity) {
			throw new BadRequestException({
				errorCode: ErrorCode.OutOfStock,
				message: 'Requested quantity is out of stock'
			});
		}
	}

	private async mapCart(cart: Cart): Promise<CartResponseDto> {
		const items = cart.items.map<CartItemResponse>((item) => {
			const variant = item.variant;
			const product = variant.product;
			const image = product.images?.find((candidate) => candidate.isPrimary);
			return {
				id: item.id,
				variantId: variant.id,
				productId: product.id,
				productName: product.name,
				slug: product.slug,
				sku: variant.sku,
				imageUrl: image?.url ?? null,
				options: variant.options,
				unitPrice: variant.price,
				quantity: item.quantity,
				lineTotal: multiplyMoney(variant.price, item.quantity)
			};
		});

		const subtotalCents = this.calculateSubtotalCents(cart);
		let discountTotalCents = 0;
		if (cart.coupon && subtotalCents > 0) {
			const couponCalculation = await this.couponsService.calculate(cart.coupon.code, subtotalCents);
			discountTotalCents = couponCalculation.discountTotalCents;
		}

		const grandTotalCents = Math.max(0, subtotalCents - discountTotalCents);
		return {
			id: cart.id,
			items,
			subtotal: centsToMoney(subtotalCents),
			discountTotal: centsToMoney(discountTotalCents),
			shippingTotal: '0.00',
			taxTotal: '0.00',
			grandTotal: centsToMoney(grandTotalCents),
			currency: items[0]?.unitPrice ? cart.items[0].variant.currency : 'AUD',
			itemCount: items.reduce((sum, item) => sum + item.quantity, 0)
		};
	}

	private calculateSubtotalCents(cart: Cart): number {
		return cart.items.reduce((sum, item) => sum + toCents(item.variant.price) * item.quantity, 0);
	}
}
