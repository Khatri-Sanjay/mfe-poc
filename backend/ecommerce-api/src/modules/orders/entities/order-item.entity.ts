import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_items' })
export class OrderItem {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_order_items_order_id')
	@Column({ name: 'order_id', type: 'uuid' })
	orderId!: string;

	@ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'order_id' })
	order!: Order;

	@Column({ name: 'product_id', type: 'uuid' })
	productId!: string;

	@Column({ name: 'variant_id', type: 'uuid' })
	variantId!: string;

	@Column({ name: 'product_name', type: 'varchar', length: 220 })
	productName!: string;

	@Column({ name: 'sku', type: 'varchar', length: 120 })
	sku!: string;

	@Column({ name: 'variant_options', type: 'jsonb', default: {} })
	variantOptions!: Record<string, string>;

	@Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
	unitPrice!: string;

	@Column({ name: 'quantity', type: 'integer' })
	quantity!: number;

	@Column({ name: 'line_total', type: 'numeric', precision: 12, scale: 2 })
	lineTotal!: string;

	@Column({ name: 'currency', type: 'char', length: 3 })
	currency!: string;
}
