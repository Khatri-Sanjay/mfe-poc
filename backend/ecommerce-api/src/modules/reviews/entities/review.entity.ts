import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique, UpdateDateColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../users/entities/user.entity';
import { ReviewStatus } from '../enums/review-status.enum';

@Entity({ name: 'reviews' })
@Unique('uq_reviews_user_product', ['userId', 'productId'])
export class Review {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_reviews_product_id')
	@Column({ name: 'product_id', type: 'uuid' })
	productId!: string;

	@ManyToOne(() => Product, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'product_id' })
	product!: Product;

	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@Column({ name: 'rating', type: 'integer' })
	rating!: number;

	@Column({ name: 'title', type: 'varchar', length: 160 })
	title!: string;

	@Column({ name: 'comment', type: 'text', nullable: true })
	comment!: string | null;

	@Column({
		name: 'status',
		type: 'enum',
		enum: ReviewStatus,
		default: ReviewStatus.Pending
	})
	status!: ReviewStatus;

	@Column({ name: 'verified_purchase', type: 'boolean', default: false })
	verifiedPurchase!: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
