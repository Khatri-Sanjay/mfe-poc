import { MigrationInterface, QueryRunner } from 'typeorm';

export class IframeAuthorization1724570400000 implements MigrationInterface {
	name = 'IframeAuthorization1724570400000';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`
      CREATE TABLE iframe_authorization_codes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code_hash char(64) NOT NULL UNIQUE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        client_id varchar(120) NOT NULL,
        redirect_uri varchar(2048) NOT NULL,
        scope text[] NOT NULL,
        code_challenge varchar(128) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_iframe_authorization_codes_code_hash_unique ON iframe_authorization_codes(code_hash)`);
		await queryRunner.query(`CREATE INDEX idx_iframe_authorization_codes_user_id ON iframe_authorization_codes(user_id)`);
		await queryRunner.query(`CREATE INDEX idx_iframe_authorization_codes_expires_at ON iframe_authorization_codes(expires_at)`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP TABLE IF EXISTS iframe_authorization_codes');
	}
}
