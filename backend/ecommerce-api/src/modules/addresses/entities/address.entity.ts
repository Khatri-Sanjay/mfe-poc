import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'addresses' })
export class Address {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_addresses_user_id')
	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@Column({ name: 'first_name', type: 'varchar', length: 100 })
	firstName!: string;

	@Column({ name: 'last_name', type: 'varchar', length: 100 })
	lastName!: string;

	@Column({ name: 'company', type: 'varchar', length: 160, nullable: true })
	company!: string | null;

	@Column({ name: 'address_line_1', type: 'varchar', length: 255 })
	addressLine1!: string;

	@Column({
		name: 'address_line_2',
		type: 'varchar',
		length: 255,
		nullable: true
	})
	addressLine2!: string | null;

	@Column({ name: 'city', type: 'varchar', length: 120 })
	city!: string;

	@Column({ name: 'state', type: 'varchar', length: 120, nullable: true })
	state!: string | null;

	@Column({ name: 'postal_code', type: 'varchar', length: 40 })
	postalCode!: string;

	@Column({ name: 'country_code', type: 'char', length: 2 })
	countryCode!: string;

	@Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
	phone!: string | null;

	@Column({ name: 'is_default_shipping', type: 'boolean', default: false })
	isDefaultShipping!: boolean;

	@Column({ name: 'is_default_billing', type: 'boolean', default: false })
	isDefaultBilling!: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
