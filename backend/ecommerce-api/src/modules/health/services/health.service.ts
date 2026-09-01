import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { PublicHealthDto } from '../dto/public-health.dto';

@Injectable()
export class HealthService {
	constructor(
		private readonly configService: ConfigService,
		@Optional() @InjectDataSource() private readonly dataSource?: DataSource
	) {}

	async getHealth(): Promise<PublicHealthDto> {
		return this.getReadiness();
	}

	getLiveness(): PublicHealthDto {
		return this.buildResponse({ http: 'ok' });
	}

	async getReadiness(): Promise<PublicHealthDto> {
		const database = await this.checkDatabase();

		return this.buildResponse({
			http: 'ok',
			database
		});
	}

	private async checkDatabase(): Promise<'ok' | 'degraded'> {
		if (!this.dataSource?.isInitialized) {
			return this.configService.get<string>('app.nodeEnv') === 'test' ? 'ok' : 'degraded';
		}

		try {
			await this.dataSource.query('SELECT 1');
			return 'ok';
		} catch {
			return 'degraded';
		}
	}

	private buildResponse(checks: Record<string, 'ok' | 'degraded'>): PublicHealthDto {
		const degraded = Object.values(checks).some((status) => status !== 'ok');

		return {
			status: degraded ? 'degraded' : 'ok',
			service: 'ecommerce-api',
			environment: this.configService.getOrThrow<string>('app.nodeEnv'),
			timestamp: new Date().toISOString(),
			checks
		};
	}
}
