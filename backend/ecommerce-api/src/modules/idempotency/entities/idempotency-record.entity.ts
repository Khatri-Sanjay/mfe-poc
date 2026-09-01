import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'idempotency_records' })
export class IdempotencyRecord {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'key', type: 'varchar', length: 120, unique: true })
	key!: string;

	@Column({ name: 'user_id', type: 'uuid' })
	userId!: string;

	@Column({ name: 'operation', type: 'varchar', length: 80 })
	operation!: string;

	@Column({ name: 'response', type: 'jsonb' })
	response!: unknown;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;
}
