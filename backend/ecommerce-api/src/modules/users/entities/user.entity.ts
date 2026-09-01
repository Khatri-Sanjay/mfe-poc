import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	JoinTable,
	ManyToMany,
	PrimaryGeneratedColumn,
	UpdateDateColumn
} from 'typeorm';
import { Role } from '../../roles/entities/role.entity';
import { UserStatus } from '../enums/user-status.enum';

@Entity({ name: 'users' })
export class User {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'first_name', type: 'varchar', length: 100 })
	firstName!: string;

	@Column({ name: 'last_name', type: 'varchar', length: 100 })
	lastName!: string;

	@Index('idx_users_email_unique', { unique: true })
	@Column({ name: 'email', type: 'varchar', length: 320 })
	email!: string;

	@Column({ name: 'phone', type: 'varchar', length: 30, nullable: true })
	phone!: string | null;

	@Column({ name: 'password_hash', type: 'varchar', length: 255 })
	passwordHash!: string;

	@Column({
		name: 'status',
		type: 'enum',
		enum: UserStatus,
		default: UserStatus.Active
	})
	status!: UserStatus;

	@Column({ name: 'email_verified', type: 'boolean', default: false })
	emailVerified!: boolean;

	@Column({ name: 'email_verified_at', type: 'timestamptz', nullable: true })
	emailVerifiedAt!: Date | null;

	@Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
	lastLoginAt!: Date | null;

	@ManyToMany(() => Role, { eager: true })
	@JoinTable({
		name: 'user_roles',
		joinColumn: { name: 'user_id', referencedColumnName: 'id' },
		inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' }
	})
	roles!: Role[];

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;

	@DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
	deletedAt!: Date | null;
}
