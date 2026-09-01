import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'shipping_methods' })
export class ShippingMethod {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'name', type: 'varchar', length: 160 })
	name!: string;

	@Column({ name: 'code', type: 'varchar', length: 80, unique: true })
	code!: string;

	@Column({ name: 'description', type: 'varchar', length: 500, nullable: true })
	description!: string | null;

	@Column({ name: 'price', type: 'numeric', precision: 12, scale: 2 })
	price!: string;

	@Column({ name: 'currency', type: 'char', length: 3, default: 'AUD' })
	currency!: string;

	@Column({ name: 'estimated_min_days', type: 'integer' })
	estimatedMinDays!: number;

	@Column({ name: 'estimated_max_days', type: 'integer' })
	estimatedMaxDays!: number;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
