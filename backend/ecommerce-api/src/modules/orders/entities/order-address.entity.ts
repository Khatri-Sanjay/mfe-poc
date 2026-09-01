import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_addresses' })
export class OrderAddress {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'order_id', type: 'uuid' })
	orderId!: string;

	@ManyToOne(() => Order, (order) => order.addresses, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'order_id' })
	order!: Order;

	@Column({ name: 'type', type: 'varchar', length: 20 })
	type!: 'shipping' | 'billing';

	@Column({ name: 'snapshot', type: 'jsonb' })
	snapshot!: Record<string, unknown>;
}
