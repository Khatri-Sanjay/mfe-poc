import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { OrderStatus } from '../enums/order-status.enum';
import { OrderAddress } from './order-address.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';

@Entity({ name: 'orders' })
export class Order {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_orders_user_id')
	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@ManyToOne(() => User, { onDelete: 'RESTRICT' })
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@Column({ name: 'status', type: 'enum', enum: OrderStatus })
	status!: OrderStatus;

	@Column({ name: 'subtotal', type: 'numeric', precision: 12, scale: 2 })
	subtotal!: string;

	@Column({ name: 'discount_total', type: 'numeric', precision: 12, scale: 2 })
	discountTotal!: string;

	@Column({ name: 'shipping_total', type: 'numeric', precision: 12, scale: 2 })
	shippingTotal!: string;

	@Column({ name: 'tax_total', type: 'numeric', precision: 12, scale: 2 })
	taxTotal!: string;

	@Column({ name: 'grand_total', type: 'numeric', precision: 12, scale: 2 })
	grandTotal!: string;

	@Column({ name: 'currency', type: 'char', length: 3 })
	currency!: string;

	@OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
	items!: OrderItem[];

	@OneToMany(() => OrderAddress, (address) => address.order, { cascade: true })
	addresses!: OrderAddress[];

	@OneToMany(() => OrderStatusHistory, (history) => history.order, {
		cascade: true
	})
	statusHistory!: OrderStatusHistory[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
