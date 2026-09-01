export enum OrderStatus {
	PendingPayment = 'PENDING_PAYMENT',
	Paid = 'PAID',
	Processing = 'PROCESSING',
	Shipped = 'SHIPPED',
	Delivered = 'DELIVERED',
	Cancelled = 'CANCELLED',
	RefundPending = 'REFUND_PENDING',
	PartiallyRefunded = 'PARTIALLY_REFUNDED',
	Refunded = 'REFUNDED'
}
