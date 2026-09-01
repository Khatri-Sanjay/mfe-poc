import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	JoinColumn,
	JoinTable,
	ManyToMany,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import { Brand } from '../../brands/entities/brand.entity';
import { Category } from '../../categories/entities/category.entity';
import { ProductStatus } from '../enums/product-status.enum';
import { ProductImage } from './product-image.entity';
import { ProductVariant } from './product-variant.entity';

@Entity({ name: 'products' })
export class Product {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'name', type: 'varchar', length: 220 })
	name!: string;

	@Index('idx_products_slug_unique', { unique: true })
	@Column({ name: 'slug', type: 'varchar', length: 240 })
	slug!: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description!: string | null;

	@Column({
		name: 'short_description',
		type: 'varchar',
		length: 500,
		nullable: true
	})
	shortDescription!: string | null;

	@Column({ name: 'brand_id', type: 'uuid', nullable: true })
	brandId!: string | null;

	@ManyToOne(() => Brand, { nullable: true, onDelete: 'SET NULL' })
	@JoinColumn({ name: 'brand_id' })
	brand!: Brand | null;

	@ManyToMany(() => Category)
	@JoinTable({
		name: 'product_categories',
		joinColumn: { name: 'product_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' }
	})
	categories!: Category[];

	@Column({
		name: 'status',
		type: 'enum',
		enum: ProductStatus,
		default: ProductStatus.Draft
	})
	status!: ProductStatus;

	@Column({ name: 'seo_title', type: 'varchar', length: 255, nullable: true })
	seoTitle!: string | null;

	@Column({
		name: 'seo_description',
		type: 'varchar',
		length: 500,
		nullable: true
	})
	seoDescription!: string | null;

	@OneToMany(() => ProductImage, (image) => image.product, {
		cascade: ['insert', 'update']
	})
	images!: ProductImage[];

	@OneToMany(() => ProductVariant, (variant) => variant.product, {
		cascade: ['insert', 'update']
	})
	variants!: ProductVariant[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;

	@DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
	deletedAt!: Date | null;
}
