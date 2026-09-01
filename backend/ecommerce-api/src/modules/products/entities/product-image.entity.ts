import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'product_images' })
export class ProductImage {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_product_images_product_id')
	@Column({ name: 'product_id', type: 'uuid' })
	productId!: string;

	@ManyToOne(() => Product, (product) => product.images, {
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'product_id' })
	product!: Product;

	@Column({ name: 'url', type: 'varchar', length: 2048 })
	url!: string;

	@Column({ name: 'alt_text', type: 'varchar', length: 255, nullable: true })
	altText!: string | null;

	@Column({ name: 'sort_order', type: 'integer', default: 0 })
	sortOrder!: number;

	@Column({ name: 'is_primary', type: 'boolean', default: false })
	isPrimary!: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
