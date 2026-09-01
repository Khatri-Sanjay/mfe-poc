import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	JoinColumn,
	ManyToOne,
	OneToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'categories' })
export class Category {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'name', type: 'varchar', length: 160 })
	name!: string;

	@Index('idx_categories_slug_unique', { unique: true })
	@Column({ name: 'slug', type: 'varchar', length: 180 })
	slug!: string;

	@Column({ name: 'description', type: 'text', nullable: true })
	description!: string | null;

	@Column({ name: 'parent_id', type: 'uuid', nullable: true })
	parentId!: string | null;

	@ManyToOne(() => Category, (category) => category.children, {
		nullable: true,
		onDelete: 'SET NULL'
	})
	@JoinColumn({ name: 'parent_id' })
	parent!: Category | null;

	@OneToMany(() => Category, (category) => category.parent)
	children!: Category[];

	@Column({ name: 'image_url', type: 'varchar', length: 2048, nullable: true })
	imageUrl!: string | null;

	@Column({ name: 'is_active', type: 'boolean', default: true })
	isActive!: boolean;

	@Column({ name: 'sort_order', type: 'integer', default: 0 })
	sortOrder!: number;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
