export interface CreatePaymentRequest {
	orderId: string;
	amount: string;
	currency: string;
}

export interface CreatePaymentResult {
	providerPaymentId: string;
	status: 'SUCCEEDED' | 'FAILED';
	failureCode?: string;
	failureMessage?: string;
}

export interface RefundPaymentRequest {
	paymentId: string;
	amount: string;
	reason: string;
}

export interface RefundPaymentResult {
	providerRefundId: string;
	status: 'SUCCEEDED' | 'FAILED';
}

export interface PaymentProvider {
	readonly name: string;
	createPayment(request: CreatePaymentRequest): Promise<CreatePaymentResult>;
	refundPayment(request: RefundPaymentRequest): Promise<RefundPaymentResult>;
}

export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
