import 'reflect-metadata';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { InitialFoundation1724570000000 } from './migrations/1724570000000-InitialFoundation';
import { IdentityAndSecurity1724570100000 } from './migrations/1724570100000-IdentityAndSecurity';
import { CatalogAndInventory1724570200000 } from './migrations/1724570200000-CatalogAndInventory';
import { CommerceCompletion1724570300000 } from './migrations/1724570300000-CommerceCompletion';

config();

if (!process.env.DATABASE_URL) {
	throw new Error('DATABASE_URL is required to run TypeORM migrations');
}

export default new DataSource({
	type: 'postgres',
	url: process.env.DATABASE_URL,
	ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
	synchronize: false,
	migrationsRun: false,
	entities: ['src/modules/**/entities/*.entity.ts'],
	migrations: [
		InitialFoundation1724570000000,
		IdentityAndSecurity1724570100000,
		CatalogAndInventory1724570200000,
		CommerceCompletion1724570300000
	]
});
