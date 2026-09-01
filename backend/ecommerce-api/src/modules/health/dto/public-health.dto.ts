import { ApiProperty } from '@nestjs/swagger';

export class PublicHealthDto {
	@ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
	status!: 'ok' | 'degraded';

	@ApiProperty({ example: 'ecommerce-api' })
	service!: string;

	@ApiProperty({ example: 'development' })
	environment!: string;

	@ApiProperty({ example: '2026-08-25T10:00:00.000Z' })
	timestamp!: string;

	@ApiProperty({
		example: {
			http: 'ok',
			database: 'ok'
		}
	})
	checks!: Record<string, 'ok' | 'degraded'>;
}
