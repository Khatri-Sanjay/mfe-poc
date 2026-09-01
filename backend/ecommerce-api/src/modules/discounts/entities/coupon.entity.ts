import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { CouponType } from '../enums/coupon-type.enum';

@Entity({ name: 'coupons' })
export class Coupon {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'code', type: 'varchar', length: 80, unique: true })
	code!: string;

	@Column({ name: 'type', type: 'enum', enum: CouponType })
	type!: CouponType;

	@Column({ name: 'value', type: 'numeric', precision: 12, scale: 2 })
	value!: string;

	@Column({
		name: 'minimum_order_amount',
		type: 'numeric',
		precision: 12,
		scale: 2,
		nullable: true
	})
	minimumOrderAmount!: string | null;

	@Column({
		name: 'maximum_discount_amount',
		type: 'numeric',
		precision: 12,
		scale: 2,
		nullable: true
	})
	maximumDiscountAmount!: string | null;

	@Column({ name: 'starts_at', type: 'timestamptz', nullable: true })
	startsAt!: Date | null;

	@Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
	expiresAt!: Date | null;

	@Column({ name: 'usage_limit', type: 'integer', nullable: true })
	usageLimit!: number | null;

	@Column({ name: 'usage_count', type: 'integer', default: 0 })
	usageCount!: number;

	@Column({ name: 'usage_limit_per_user', type: 'integer', nullable: true })
	usageLimitPerUser!: number | null;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
