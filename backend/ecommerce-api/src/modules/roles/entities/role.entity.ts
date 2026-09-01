import { Column, CreateDateColumn, Entity, JoinTable, ManyToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Permission } from '../../permissions/entities/permission.entity';

@Entity({ name: 'roles' })
export class Role {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'name', type: 'varchar', length: 80, unique: true })
	name!: string;

	@Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
	description!: string | null;

	@ManyToMany(() => Permission, { eager: true })
	@JoinTable({
		name: 'role_permissions',
		joinColumn: { name: 'role_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' }
	})
	permissions!: Permission[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
