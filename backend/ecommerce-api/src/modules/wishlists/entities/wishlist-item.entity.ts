import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'wishlist_items' })
@Unique('uq_wishlist_user_product', ['userId', 'productId'])
export class WishlistItem {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_wishlist_items_user_id')
	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@Column({ name: 'product_id', type: 'uuid' })
	productId!: string;

	@ManyToOne(() => Product, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product!: Product;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;
}
