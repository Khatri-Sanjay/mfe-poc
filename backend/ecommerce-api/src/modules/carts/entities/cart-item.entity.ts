import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';
import { Cart } from './cart.entity';

@Entity({ name: 'cart_items' })
@Unique('uq_cart_items_cart_variant', ['cartId', 'variantId'])
export class CartItem {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_cart_items_cart_id')
	@Column({ name: 'cart_id', type: 'uuid' })
	cartId!: string;

	@ManyToOne(() => Cart, (cart) => cart.items, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'cart_id' })
	cart!: Cart;

	@Column({ name: 'variant_id', type: 'uuid' })
	variantId!: string;

	@ManyToOne(() => ProductVariant, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariant;

	@Column({ name: 'quantity', type: 'integer' })
	quantity!: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
