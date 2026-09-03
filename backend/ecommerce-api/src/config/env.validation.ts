import Joi from 'joi';

export const envValidationSchema = Joi.object({
	NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
	PORT: Joi.number().port().default(3000),
	LOG_LEVEL: Joi.string().valid('fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent').default('info'),
	DATABASE_URL: Joi.string()
		.uri({ scheme: ['postgres', 'postgresql'] })
		.when('NODE_ENV', {
			is: 'test',
			then: Joi.optional(),
			otherwise: Joi.required()
		}),
	DATABASE_SSL: Joi.boolean().truthy('true').falsy('false').default(false),
	CORS_ORIGINS: Joi.string().default(
		'http://localhost:4200,http://localhost:4201,http://localhost:4202,http://localhost:4203,http://localhost:4204,http://localhost:4205'
	),
	JWT_ACCESS_SECRET: Joi.string()
		.min(32)
		.when('NODE_ENV', {
			is: 'test',
			then: Joi.string().min(32).default('test-access-secret-that-is-at-least-32-characters'),
			otherwise: Joi.required()
		}),
	JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
	REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('30d'),
	PASSWORD_RESET_TOKEN_TTL: Joi.string().default('15m'),
	EMAIL_VERIFICATION_TOKEN_TTL: Joi.string().default('24h'),
	IFRAME_CLIENT_ID: Joi.string().default('commerce-insights-iframe'),
	IFRAME_REDIRECT_URI: Joi.string().uri({ scheme: ['http', 'https'] }).default('http://localhost:8000/app/'),
	IFRAME_AUTHORIZATION_CODE_TTL: Joi.string().default('60s'),
	IFRAME_ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('5m'),
	IFRAME_ALLOWED_SCOPES: Joi.string().default('product.read,inventory.read,order.read,review.manage'),
	PAYMENT_PROVIDER: Joi.string().valid('mock').default('mock'),
	THROTTLE_TTL: Joi.number().integer().positive().default(60000),
	THROTTLE_LIMIT: Joi.number().integer().positive().default(100),
	DEV_ADMIN_EMAIL: Joi.string().email().optional(),
	DEV_ADMIN_PASSWORD: Joi.string().min(12).optional()
});
