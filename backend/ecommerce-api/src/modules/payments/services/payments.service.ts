import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { PaymentResponseDto } from '../dto/payment.dto';
import { Payment } from '../entities/payment.entity';
import { PaymentStatus } from '../enums/payment-status.enum';
import { PAYMENT_PROVIDER } from '../interfaces/payment-provider.interface';
import type { PaymentProvider } from '../interfaces/payment-provider.interface';

const mapPayment = (payment: Payment): PaymentResponseDto => ({
	id: payment.id,
	orderId: payment.orderId,
	provider: payment.provider,
	providerPaymentId: payment.providerPaymentId,
	amount: payment.amount,
	currency: payment.currency,
	status: payment.status,
	failureCode: payment.failureCode,
	failureMessage: payment.failureMessage
});

@Injectable()
export class PaymentsService {
	constructor(
		@InjectRepository(Payment)
		private readonly repository: Repository<Payment>,
		@Inject(PAYMENT_PROVIDER)
		private readonly provider: PaymentProvider
	) {}

	async createForOrder(orderId: string, amount: string, currency: string, manager?: EntityManager): Promise<Payment> {
		const result = await this.provider.createPayment({
			orderId,
			amount,
			currency
		});
		const target = manager ?? this.repository.manager;
		return target.save(
			target.create(Payment, {
				orderId,
				provider: this.provider.name,
				providerPaymentId: result.providerPaymentId,
				amount,
				currency,
				status: result.status === 'SUCCEEDED' ? PaymentStatus.Succeeded : PaymentStatus.Failed,
				failureCode: result.failureCode ?? null,
				failureMessage: result.failureMessage ?? null
			})
		);
	}

	async getByOrder(orderId: string): Promise<Payment | null> {
		return this.repository.findOne({ where: { orderId } });
	}

	async get(id: string): Promise<PaymentResponseDto> {
		return mapPayment(await this.findEntity(id));
	}

	async findEntity(id: string): Promise<Payment> {
		const payment = await this.repository.findOne({ where: { id } });
		if (!payment) {
			throw new NotFoundException({
				errorCode: ErrorCode.PaymentNotFound,
				message: 'Payment was not found'
			});
		}
		return payment;
	}

	map(payment: Payment): PaymentResponseDto {
		return mapPayment(payment);
	}
}
