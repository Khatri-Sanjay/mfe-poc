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
import { Coupon } from '../../discounts/entities/coupon.entity';
import { User } from '../../users/entities/user.entity';
import { CartItem } from './cart-item.entity';

@Entity({ name: 'carts' })
export class Cart {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_carts_user_id_unique', { unique: true })
	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@Column({ name: 'coupon_id', type: 'uuid', nullable: true })
	couponId!: string | null;

	@ManyToOne(() => Coupon, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'coupon_id' })
	coupon!: Coupon | null;

	@OneToMany(() => CartItem, (item) => item.cart, { cascade: true })
	items!: CartItem[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
