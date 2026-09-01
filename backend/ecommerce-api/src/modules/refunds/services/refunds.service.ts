import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { centsToMoney, toCents } from '../../../common/utils/money.util';
import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { Payment } from '../../payments/entities/payment.entity';
import { PaymentStatus } from '../../payments/enums/payment-status.enum';
import { PAYMENT_PROVIDER } from '../../payments/interfaces/payment-provider.interface';
import type { PaymentProvider } from '../../payments/interfaces/payment-provider.interface';
import { CreateRefundDto } from '../../orders/dto/order.dto';
import { RefundResponseDto } from '../dto/refund.dto';
import { Refund } from '../entities/refund.entity';
import { RefundStatus } from '../enums/refund-status.enum';

const mapRefund = (refund: Refund): RefundResponseDto => ({
	id: refund.id,
	paymentId: refund.paymentId,
	orderId: refund.orderId,
	amount: refund.amount,
	reason: refund.reason,
	providerRefundId: refund.providerRefundId,
	status: refund.status,
	createdBy: refund.createdBy
});

@Injectable()
export class RefundsService {
	constructor(
		@InjectRepository(Refund)
		private readonly refundRepository: Repository<Refund>,
		@InjectRepository(Payment)
		private readonly paymentRepository: Repository<Payment>,
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>,
		@Inject(PAYMENT_PROVIDER)
		private readonly provider: PaymentProvider
	) {}

	async create(orderId: string, dto: CreateRefundDto, createdBy: string): Promise<RefundResponseDto> {
		const order = await this.orderRepository.findOne({
			where: { id: orderId }
		});
		if (!order) {
			throw new NotFoundException({
				errorCode: ErrorCode.OrderNotFound,
				message: 'Order was not found'
			});
		}

		const payment = await this.paymentRepository.findOne({
			where: { orderId, status: PaymentStatus.Succeeded }
		});
		if (!payment) {
			throw new NotFoundException({
				errorCode: ErrorCode.PaymentNotFound,
				message: 'Payment was not found'
			});
		}

		const requestedCents = toCents(dto.amount);
		const existingRefunds = await this.refundRepository.find({
			where: { paymentId: payment.id, status: RefundStatus.Succeeded }
		});
		const refundedCents = existingRefunds.reduce((sum, refund) => sum + toCents(refund.amount), 0);

		if (requestedCents <= 0 || refundedCents + requestedCents > toCents(payment.amount)) {
			throw new BadRequestException({
				errorCode: ErrorCode.Conflict,
				message: 'Refund amount exceeds refundable amount'
			});
		}

		const result = await this.provider.refundPayment({
			paymentId: payment.id,
			amount: dto.amount,
			reason: dto.reason
		});

		const refund = await this.refundRepository.save(
			this.refundRepository.create({
				paymentId: payment.id,
				orderId,
				amount: dto.amount,
				reason: dto.reason,
				providerRefundId: result.providerRefundId,
				status: result.status === 'SUCCEEDED' ? RefundStatus.Succeeded : RefundStatus.Failed,
				createdBy
			})
		);

		const totalRefundedCents = refundedCents + requestedCents;
		payment.status = totalRefundedCents === toCents(payment.amount) ? PaymentStatus.Refunded : PaymentStatus.PartiallyRefunded;
		order.status = totalRefundedCents === toCents(payment.amount) ? OrderStatus.Refunded : OrderStatus.PartiallyRefunded;
		payment.amount = centsToMoney(toCents(payment.amount));
		await this.paymentRepository.save(payment);
		await this.orderRepository.save(order);

		return mapRefund(refund);
	}
}
