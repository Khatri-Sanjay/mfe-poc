import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'iframe_authorization_codes' })
export class IframeAuthorizationCode {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_iframe_authorization_codes_code_hash_unique', { unique: true })
	@Column({ name: 'code_hash', type: 'char', length: 64 })
	codeHash!: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@Column({ name: 'client_id', type: 'varchar', length: 120 })
	clientId!: string;

	@Column({ name: 'redirect_uri', type: 'varchar', length: 2048 })
	redirectUri!: string;

	@Column({ name: 'scope', type: 'text', array: true })
	scope!: string[];

	@Column({ name: 'code_challenge', type: 'varchar', length: 128 })
	codeChallenge!: string;

	@Column({ name: 'expires_at', type: 'timestamptz' })
	expiresAt!: Date;

	@Column({ name: 'used_at', type: 'timestamptz', nullable: true })
	usedAt!: Date | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;
}
