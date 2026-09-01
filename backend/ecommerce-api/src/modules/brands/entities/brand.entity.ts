import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity({ name: 'brands' })
export class Brand {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'name', type: 'varchar', length: 160 })
	name!: string;

	@Index('idx_brands_slug_unique', { unique: true })
	@Column({ name: 'slug', type: 'varchar', length: 180 })
	slug!: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description!: string | null;

	@Column({ name: 'logo_url', type: 'varchar', length: 2048, nullable: true })
	logoUrl!: string | null;

	@Column({
		name: 'website_url',
		type: 'varchar',
		length: 2048,
		nullable: true
	})
	websiteUrl!: string | null;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
