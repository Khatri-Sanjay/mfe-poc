import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { InitialFoundation1724570000000 } from './migrations/1724570000000-InitialFoundation';
import { IdentityAndSecurity1724570100000 } from './migrations/1724570100000-IdentityAndSecurity';
import { CatalogAndInventory1724570200000 } from './migrations/1724570200000-CatalogAndInventory';
import { CommerceCompletion1724570300000 } from './migrations/1724570300000-CommerceCompletion';

@Module({
	imports: [
		...(process.env.NODE_ENV === 'test' && !process.env.DATABASE_URL
			? []
			: [
					TypeOrmModule.forRootAsync({
						inject: [ConfigService],
						useFactory: (configService: ConfigService): TypeOrmModuleOptions => ({
							type: 'postgres',
							url: configService.getOrThrow<string>('database.url'),
							ssl: configService.get<boolean>('database.ssl') ? { rejectUnauthorized: false } : false,
							autoLoadEntities: true,
							synchronize: false,
							migrations: [
								InitialFoundation1724570000000,
								IdentityAndSecurity1724570100000,
								CatalogAndInventory1724570200000,
								CommerceCompletion1724570300000
							],
							migrationsRun: configService.get<string>('app.nodeEnv') === 'test',
							logging: configService.get<string>('app.nodeEnv') === 'development'
						})
					})
				])
	]
})
export class DatabaseModule {}
