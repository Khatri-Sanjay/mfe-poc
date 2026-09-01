import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { centsToMoney, multiplyMoney, toCents } from '../../../common/utils/money.util';
import { AddressesService } from '../../addresses/services/addresses.service';
import { CartsService } from '../../carts/services/carts.service';
import { CouponsService } from '../../discounts/services/coupons.service';
import { IdempotencyService } from '../../idempotency/services/idempotency.service';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { OrderAddress } from '../../orders/entities/order-address.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import { OrderStatusHistory } from '../../orders/entities/order-status-history.entity';
import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { mapOrder } from '../../orders/services/orders.service';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { PaymentsService } from '../../payments/services/payments.service';
import { ProductStatus } from '../../products/enums/product-status.enum';
import { ShippingMethodsService } from '../../shipping/services/shipping-methods.service';
import { CheckoutDto, CheckoutQuoteDto } from '../dto/checkout.dto';

@Injectable()
export class CheckoutService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly cartsService: CartsService,
		private readonly addressesService: AddressesService,
		private readonly shippingMethodsService: ShippingMethodsService,
		private readonly couponsService: CouponsService,
		private readonly paymentsService: PaymentsService,
		private readonly idempotencyService: IdempotencyService
	) {}

	async quote(userId: string, dto: CheckoutQuoteDto) {
		const cart = await this.cartsService.getCartEntity(userId);
		if (cart.items.length === 0) {
			throw new BadRequestException({
				errorCode: ErrorCode.CartNotFound,
				message: 'Cart is empty'
			});
		}

		const subtotalCents = cart.items.reduce((sum, item) => sum + toCents(item.variant.price) * item.quantity, 0);
		let discountCents = 0;
		if (cart.coupon) {
			discountCents = (await this.couponsService.calculate(cart.coupon.code, subtotalCents)).discountTotalCents;
		}
		const shippingMethod = dto.shippingMethodId ? await this.shippingMethodsService.findActive(dto.shippingMethodId) : null;
		const shippingCents = shippingMethod ? toCents(shippingMethod.price) : 0;
		const taxCents = 0;

		return {
			cart: await this.cartsService.getCart(userId),
			shippingMethod,
			subtotal: centsToMoney(subtotalCents),
			discountTotal: centsToMoney(discountCents),
			shippingTotal: centsToMoney(shippingCents),
			taxTotal: centsToMoney(taxCents),
			grandTotal: centsToMoney(Math.max(0, subtotalCents - discountCents + shippingCents + taxCents)),
			currency: cart.items[0].variant.currency
		};
	}

	async checkout(userId: string, dto: CheckoutDto, idempotencyKey?: string) {
		if (idempotencyKey) {
			const existing = await this.idempotencyService.find(userId, idempotencyKey, 'checkout');
			if (existing) {
				return existing.response;
			}
		}

		const shippingAddress = await this.addressesService.findOwned(userId, dto.shippingAddressId);
		const billingAddress = await this.addressesService.findOwned(userId, dto.billingAddressId);
		const shippingMethod = await this.shippingMethodsService.findActive(dto.shippingMethodId);

		const response = await this.dataSource.transaction(async (manager) => {
			const cart = await this.cartsService.getCartEntity(userId);
			if (cart.items.length === 0) {
				throw new BadRequestException({
					errorCode: ErrorCode.CartNotFound,
					message: 'Cart is empty'
				});
			}

			let subtotalCents = 0;
			for (const item of cart.items) {
				const product = item.variant.product;
				if (!item.variant.isActive || product.status !== ProductStatus.Active) {
					throw new NotFoundException({
						errorCode: ErrorCode.ProductNotFound,
						message: 'Product variant was not found'
					});
				}

				const inventory = await manager.findOne(InventoryItem, {
					where: { variantId: item.variantId },
					lock: { mode: 'pessimistic_write' }
				});
				const available = (inventory?.quantityOnHand ?? 0) - (inventory?.quantityReserved ?? 0);
				if (!inventory || available < item.quantity) {
					throw new BadRequestException({
						errorCode: ErrorCode.OutOfStock,
						message: 'Requested quantity is out of stock'
					});
				}
				inventory.quantityOnHand -= item.quantity;
				await manager.save(inventory);
				subtotalCents += toCents(item.variant.price) * item.quantity;
			}

			let discountCents = 0;
			if (cart.coupon) {
				const calculation = await this.couponsService.calculate(cart.coupon.code, subtotalCents);
				discountCents = calculation.discountTotalCents;
				await this.couponsService.incrementUsage(calculation.coupon.id);
			}

			const shippingCents = toCents(shippingMethod.price);
			const grandTotal = centsToMoney(Math.max(0, subtotalCents - discountCents + shippingCents));

			const order = await manager.save(
				manager.create(Order, {
					userId,
					status: OrderStatus.Paid,
					subtotal: centsToMoney(subtotalCents),
					discountTotal: centsToMoney(discountCents),
					shippingTotal: shippingMethod.price,
					taxTotal: '0.00',
					grandTotal,
					currency: cart.items[0].variant.currency
				})
			);

			await manager.save(
				cart.items.map((item) =>
					manager.create(OrderItem, {
						orderId: order.id,
						productId: item.variant.product.id,
						variantId: item.variant.id,
						productName: item.variant.product.name,
						sku: item.variant.sku,
						variantOptions: item.variant.options,
						unitPrice: item.variant.price,
						quantity: item.quantity,
						lineTotal: multiplyMoney(item.variant.price, item.quantity),
						currency: item.variant.currency
					})
				)
			);

			await manager.save([
				manager.create(OrderAddress, {
					orderId: order.id,
					type: 'shipping',
					snapshot: { ...shippingAddress }
				}),
				manager.create(OrderAddress, {
					orderId: order.id,
					type: 'billing',
					snapshot: { ...billingAddress }
				})
			]);
			await manager.save(
				manager.create(OrderStatusHistory, {
					orderId: order.id,
					fromStatus: null,
					toStatus: OrderStatus.Paid,
					note: 'Checkout completed',
					changedBy: userId
				})
			);

			const payment = await this.paymentsService.createForOrder(order.id, grandTotal, order.currency, manager);
			if (payment.status !== PaymentStatus.Succeeded) {
				throw new BadRequestException({
					errorCode: ErrorCode.PaymentFailed,
					message: 'Payment failed'
				});
			}

			await this.cartsService.emptyCart(cart.id);
			const completed = await manager.findOneOrFail(Order, {
				where: { id: order.id },
				relations: { items: true }
			});

			return {
				order: mapOrder(completed),
				payment: {
					id: payment.id,
					status: payment.status,
					amount: payment.amount,
					currency: payment.currency
				}
			};
		});

		if (idempotencyKey) {
			await this.idempotencyService.save(userId, idempotencyKey, 'checkout', response);
		}

		return response;
	}
}
