import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'auth_sessions' })
export class AuthSession {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_auth_sessions_user_id')
	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@ManyToOne(() => User, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'user_id' })
	user!: User;

	@Column({ name: 'refresh_token_hash', type: 'varchar', length: 255 })
	refreshTokenHash!: string;

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt!: Date;

	@Column({ name: 'revoked_at', type: 'timestamptz', nullable: true })
	revokedAt!: Date | null;

	@Column({ name: 'rotated_at', type: 'timestamptz', nullable: true })
	rotatedAt!: Date | null;

	@Column({ name: 'ip_address', type: 'varchar', length: 64, nullable: true })
	ipAddress!: string | null;

	@Column({ name: 'user_agent', type: 'varchar', length: 512, nullable: true })
	userAgent!: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
