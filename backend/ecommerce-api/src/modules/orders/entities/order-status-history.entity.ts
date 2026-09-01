import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderStatus } from '../enums/order-status.enum';
import { Order } from './order.entity';

@Entity({ name: 'order_status_history' })
export class OrderStatusHistory {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'order_id', type: 'uuid' })
	orderId!: string;

	@ManyToOne(() => Order, (order) => order.statusHistory, {
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'order_id' })
	order!: Order;

	@Column({
		name: 'from_status',
		type: 'enum',
		enum: OrderStatus,
		nullable: true
	})
	fromStatus!: OrderStatus | null;

	@Column({ name: 'to_status', type: 'enum', enum: OrderStatus })
	toStatus!: OrderStatus;

	@Column({ name: 'note', type: 'varchar', length: 500, nullable: true })
	note!: string | null;

	@Column({ name: 'changed_by', type: 'uuid', nullable: true })
	changedBy!: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;
}
