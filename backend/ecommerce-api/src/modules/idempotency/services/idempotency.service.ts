import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IdempotencyRecord } from '../entities/idempotency-record.entity';

@Injectable()
export class IdempotencyService {
	constructor(
		@InjectRepository(IdempotencyRecord)
		private readonly repository: Repository<IdempotencyRecord>
	) {}

	async find(userId: string, key: string, operation: string): Promise<IdempotencyRecord | null> {
		return this.repository.findOne({ where: { userId, key, operation } });
	}

	async save(userId: string, key: string, operation: string, response: unknown): Promise<void> {
		await this.repository.save(
			this.repository.create({
				userId,
				key,
				operation,
				response
			})
		);
	}
}
