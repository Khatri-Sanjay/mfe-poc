import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Payment } from '../../payments/entities/payment.entity';
import { RefundStatus } from '../enums/refund-status.enum';

@Entity({ name: 'refunds' })
export class Refund {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_refunds_payment_id')
	@Column({ name: 'payment_id', type: 'uuid' })
	paymentId!: string;

	@ManyToOne(() => Payment, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'payment_id' })
	payment!: Payment;

	@Column({ name: 'order_id', type: 'uuid' })
	orderId!: string;

	@ManyToOne(() => Order, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'order_id' })
	order!: Order;

	@Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
	amount!: string;

	@Column({ name: 'reason', type: 'varchar', length: 500 })
	reason!: string;

	@Column({ name: 'provider_refund_id', type: 'varchar', length: 160 })
	providerRefundId!: string;

	@Column({ name: 'status', type: 'enum', enum: RefundStatus })
	status!: RefundStatus;

	@Column({ name: 'created_by', type: 'uuid', nullable: true })
	createdBy!: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
