import { registerAs } from '@nestjs/config';

const parseCorsOrigins = (value: string): string[] =>
	value
		.split(',')
		.map((origin) => origin.trim())
		.filter(Boolean);

export default registerAs('app', () => ({
	nodeEnv: process.env.NODE_ENV ?? 'development',
	port: Number(process.env.PORT ?? 3000),
	corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS ?? ''),
	logLevel: process.env.LOG_LEVEL ?? 'info',
	apiPrefix: 'api',
	apiVersion: '1'
}));
