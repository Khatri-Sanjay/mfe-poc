import { MigrationInterface, QueryRunner } from 'typeorm';

export class IdentityAndSecurity1724570100000 implements MigrationInterface {
	name = 'IdentityAndSecurity1724570100000';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED')`);
		await queryRunner.query(`
      CREATE TABLE permissions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL UNIQUE,
        description varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`
      CREATE TABLE roles (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(80) NOT NULL UNIQUE,
        description varchar(255),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`
      CREATE TABLE role_permissions (
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        CONSTRAINT pk_role_permissions PRIMARY KEY (role_id, permission_id)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_role_permissions_role_id ON role_permissions(role_id)`);
		await queryRunner.query(`CREATE INDEX idx_role_permissions_permission_id ON role_permissions(permission_id)`);
		await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        email varchar(320) NOT NULL,
        phone varchar(30),
        password_hash varchar(255) NOT NULL,
        status user_status_enum NOT NULL DEFAULT 'ACTIVE',
        email_verified boolean NOT NULL DEFAULT false,
        email_verified_at timestamptz,
        last_login_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT uq_users_email UNIQUE (email)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_users_status ON users(status)`);
		await queryRunner.query(`
      CREATE TABLE user_roles (
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        CONSTRAINT pk_user_roles PRIMARY KEY (user_id, role_id)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_user_roles_user_id ON user_roles(user_id)`);
		await queryRunner.query(`CREATE INDEX idx_user_roles_role_id ON user_roles(role_id)`);
		await queryRunner.query(`
      CREATE TABLE auth_sessions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        refresh_token_hash varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        revoked_at timestamptz,
        rotated_at timestamptz,
        ip_address varchar(64),
        user_agent varchar(512),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_auth_sessions_user_id ON auth_sessions(user_id)`);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_auth_sessions_refresh_token_hash ON auth_sessions(refresh_token_hash)`);
		await queryRunner.query(`
      CREATE TABLE password_reset_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id)`);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_password_reset_tokens_token_hash ON password_reset_tokens(token_hash)`);
		await queryRunner.query(`
      CREATE TABLE email_verification_tokens (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash varchar(255) NOT NULL,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_email_verification_tokens_user_id ON email_verification_tokens(user_id)`);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_email_verification_tokens_token_hash ON email_verification_tokens(token_hash)`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP TABLE IF EXISTS email_verification_tokens');
		await queryRunner.query('DROP TABLE IF EXISTS password_reset_tokens');
		await queryRunner.query('DROP TABLE IF EXISTS auth_sessions');
		await queryRunner.query('DROP TABLE IF EXISTS user_roles');
		await queryRunner.query('DROP TABLE IF EXISTS users');
		await queryRunner.query('DROP TABLE IF EXISTS role_permissions');
		await queryRunner.query('DROP TABLE IF EXISTS roles');
		await queryRunner.query('DROP TABLE IF EXISTS permissions');
		await queryRunner.query('DROP TYPE IF EXISTS user_status_enum');
	}
}
