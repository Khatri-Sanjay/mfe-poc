import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialFoundation1724570000000 implements MigrationInterface {
	name = 'InitialFoundation1724570000000';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
	}

	async down(): Promise<void> {
		return Promise.resolve();
	}
}
