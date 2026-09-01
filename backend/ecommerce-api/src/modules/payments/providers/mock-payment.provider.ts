import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import type {
	CreatePaymentRequest,
	CreatePaymentResult,
	PaymentProvider,
	RefundPaymentRequest,
	RefundPaymentResult
} from '../interfaces/payment-provider.interface';

@Injectable()
export class MockPaymentProvider implements PaymentProvider {
	readonly name = 'mock';

	createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult> {
		void request;
		return Promise.resolve({
			providerPaymentId: `mock_pay_${randomUUID()}`,
			status: 'SUCCEEDED'
		});
	}

	refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResult> {
		void request;
		return Promise.resolve({
			providerRefundId: `mock_ref_${randomUUID()}`,
			status: 'SUCCEEDED'
		});
	}
}
