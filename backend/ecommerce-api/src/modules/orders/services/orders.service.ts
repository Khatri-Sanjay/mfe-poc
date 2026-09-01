import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createPaginationMeta } from '../../../common/utils/pagination.util';
import { AdminOrderQueryDto, OrderResponseDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { Order } from '../entities/order.entity';
import { OrderStatusHistory } from '../entities/order-status-history.entity';
import { OrderStatus } from '../enums/order-status.enum';

const allowedTransitions = new Map<OrderStatus, OrderStatus[]>([
	[OrderStatus.PendingPayment, [OrderStatus.Paid, OrderStatus.Cancelled]],
	[OrderStatus.Paid, [OrderStatus.Processing, OrderStatus.Cancelled, OrderStatus.RefundPending]],
	[OrderStatus.Processing, [OrderStatus.Shipped, OrderStatus.Cancelled, OrderStatus.RefundPending]],
	[OrderStatus.Shipped, [OrderStatus.Delivered, OrderStatus.RefundPending]],
	[OrderStatus.Delivered, [OrderStatus.RefundPending]],
	[OrderStatus.RefundPending, [OrderStatus.PartiallyRefunded, OrderStatus.Refunded]],
	[OrderStatus.PartiallyRefunded, [OrderStatus.Refunded]]
]);

export const mapOrder = (order: Order): OrderResponseDto => ({
	id: order.id,
	status: order.status,
	subtotal: order.subtotal,
	discountTotal: order.discountTotal,
	shippingTotal: order.shippingTotal,
	taxTotal: order.taxTotal,
	grandTotal: order.grandTotal,
	currency: order.currency,
	items:
		order.items?.map((item) => ({
			id: item.id,
			productId: item.productId,
			variantId: item.variantId,
			productName: item.productName,
			sku: item.sku,
			variantOptions: item.variantOptions,
			unitPrice: item.unitPrice,
			quantity: item.quantity,
			lineTotal: item.lineTotal,
			currency: item.currency
		})) ?? []
});

@Injectable()
export class OrdersService {
	constructor(
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@InjectRepository(OrderStatusHistory)
		private readonly historyRepository: Repository<OrderStatusHistory>
	) {}

	async listCustomer(userId: string, page = 1, limit = 20) {
		const [orders, total] = await this.orderRepository.findAndCount({
			where: { userId },
			relations: { items: true },
			order: { createdAt: 'DESC' },
			skip: (page - 1) * limit,
			take: limit
		});
		return {
			items: orders.map(mapOrder),
			meta: createPaginationMeta(page, limit, total)
		};
	}

	async getCustomer(userId: string, id: string): Promise<OrderResponseDto> {
		const order = await this.findWithItems(id);
		if (order.userId !== userId) {
			throw new ForbiddenException({
				errorCode: ErrorCode.Forbidden,
				message: 'You cannot access this order'
			});
		}
		return mapOrder(order);
	}

	async cancelCustomer(userId: string, id: string): Promise<OrderResponseDto> {
		const order = await this.findWithItems(id);
		if (order.userId !== userId) {
			throw new ForbiddenException({
				errorCode: ErrorCode.Forbidden,
				message: 'You cannot access this order'
			});
		}
		if (![OrderStatus.PendingPayment, OrderStatus.Paid].includes(order.status)) {
			throw new BadRequestException({
				errorCode: ErrorCode.OrderCannotBeCancelled,
				message: 'Order cannot be cancelled'
			});
		}
		await this.transition(order, OrderStatus.Cancelled, userId, 'Customer cancel');
		return mapOrder(order);
	}

	async listAdmin(query: AdminOrderQueryDto) {
		const builder = this.orderRepository
			.createQueryBuilder('order')
			.leftJoinAndSelect('order.items', 'items')
			.orderBy('order.createdAt', 'DESC')
			.skip((query.page - 1) * query.limit)
			.take(query.limit);

		if (query.status) {
			builder.andWhere('order.status = :status', { status: query.status });
		}

		const [orders, total] = await builder.getManyAndCount();
		return {
			items: orders.map(mapOrder),
			meta: createPaginationMeta(query.page, query.limit, total)
		};
	}

	async getAdmin(id: string): Promise<OrderResponseDto> {
		return mapOrder(await this.findWithItems(id));
	}

	async updateStatus(id: string, dto: UpdateOrderStatusDto, changedBy: string): Promise<OrderResponseDto> {
		const order = await this.findWithItems(id);
		this.assertTransition(order.status, dto.status);
		await this.transition(order, dto.status, changedBy, dto.note ?? null);
		return mapOrder(order);
	}

	async transition(order: Order, toStatus: OrderStatus, changedBy: string | null, note: string | null): Promise<void> {
		const fromStatus = order.status;
		order.status = toStatus;
		await this.orderRepository.save(order);
		await this.historyRepository.save(
			this.historyRepository.create({
				orderId: order.id,
				fromStatus,
				toStatus,
				changedBy,
				note
			})
		);
	}

	private assertTransition(from: OrderStatus, to: OrderStatus): void {
		if (from === to) {
			return;
		}
		if (!allowedTransitions.get(from)?.includes(to)) {
			throw new BadRequestException({
				errorCode: ErrorCode.Conflict,
				message: 'Order status transition is not allowed'
			});
		}
	}

	private async findWithItems(id: string): Promise<Order> {
		const order = await this.orderRepository.findOne({
			where: { id },
			relations: { items: true, addresses: true, statusHistory: true }
		});
		if (!order) {
			throw new NotFoundException({
				errorCode: ErrorCode.OrderNotFound,
				message: 'Order was not found'
			});
		}
		return order;
	}
}
