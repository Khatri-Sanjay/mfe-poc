import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToOne,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { Product } from './product.entity';

@Entity({ name: 'product_variants' })
export class ProductVariant {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_product_variants_product_id')
	@Column({ name: 'product_id', type: 'uuid' })
	productId!: string;

	@ManyToOne(() => Product, (product) => product.variants, {
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'product_id' })
	product!: Product;

	@Index('idx_product_variants_sku_unique', { unique: true })
	@Column({ name: 'sku', type: 'varchar', length: 120 })
	sku!: string;

	@Column({ name: 'barcode', type: 'varchar', length: 120, nullable: true })
	barcode!: string | null;

	@Column({ name: 'name', type: 'varchar', length: 180 })
	name!: string;

	@Column({ name: 'options', type: 'jsonb', default: {} })
	options!: Record<string, string>;

	@Column({ name: 'price', type: 'numeric', precision: 12, scale: 2 })
	price!: string;

	@Column({
		name: 'compare_at_price',
		type: 'numeric',
		precision: 12,
		scale: 2,
		nullable: true
	})
	compareAtPrice!: string | null;

	@Column({
		name: 'cost_price',
		type: 'numeric',
		precision: 12,
		scale: 2,
		nullable: true
	})
	costPrice!: string | null;

	@Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
	currency!: string;

	@Column({
		name: 'weight',
		type: 'numeric',
		precision: 10,
		scale: 3,
		nullable: true
	})
	weight!: string | null;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean;

	@OneToOne(() => InventoryItem, (inventoryItem) => inventoryItem.variant)
	inventoryItem!: InventoryItem | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
