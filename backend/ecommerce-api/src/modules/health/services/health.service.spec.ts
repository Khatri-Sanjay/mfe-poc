import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { HealthService } from './health.service';

describe('HealthService', () => {
	const configService = {
		get: jest.fn((key: string) => (key === 'app.nodeEnv' ? 'test' : undefined)),
		getOrThrow: jest.fn((key: string) => (key === 'app.nodeEnv' ? 'test' : undefined))
	} as unknown as ConfigService;

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('returns liveness without dependency checks', () => {
		const service = new HealthService(configService);

		expect(service.getLiveness()).toMatchObject({
			status: 'ok',
			service: 'ecommerce-api',
			environment: 'test',
			checks: {
				http: 'ok'
			}
		});
	});

	it('marks readiness ok when the database query succeeds', async () => {
		const dataSource = {
			isInitialized: true,
			query: jest.fn().mockResolvedValue([{ '?column?': 1 }])
		} as unknown as DataSource;
		const service = new HealthService(configService, dataSource);

		await expect(service.getReadiness()).resolves.toMatchObject({
			status: 'ok',
			checks: {
				http: 'ok',
				database: 'ok'
			}
		});
	});
});
