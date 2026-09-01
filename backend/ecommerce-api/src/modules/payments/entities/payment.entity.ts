import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { PaymentStatus } from '../enums/payment-status.enum';

@Entity({ name: 'payments' })
export class Payment {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_payments_order_id')
	@Column({ name: 'order_id', type: 'uuid' })
	orderId!: string;

	@ManyToOne(() => Order, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'order_id' })
	order!: Order;

	@Column({ name: 'provider', type: 'varchar', length: 60 })
	provider!: string;

	@Column({ name: 'provider_payment_id', type: 'varchar', length: 160 })
	providerPaymentId!: string;

	@Column({ name: 'amount', type: 'numeric', precision: 12, scale: 2 })
	amount!: string;

	@Column({ name: 'currency', type: 'char', length: 3 })
	currency!: string;

	@Column({ name: 'status', type: 'enum', enum: PaymentStatus })
	status!: PaymentStatus;

	@Column({
		name: 'failure_code',
		type: 'varchar',
		length: 120,
		nullable: true
	})
	failureCode!: string | null;

	@Column({
		name: 'failure_message',
		type: 'varchar',
		length: 500,
		nullable: true
	})
	failureMessage!: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
