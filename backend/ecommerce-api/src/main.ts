import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { API_PREFIX, API_VERSION } from './common/constants/api.constants';
import { createSwaggerDocument } from './config/swagger.config';

async function bootstrap(): Promise<void> {
	const app = await NestFactory.create(AppModule, {
		bufferLogs: true
	});
	const configService = app.get(ConfigService);
	const logger = app.get(Logger);

	app.useLogger(logger);
	app.use(helmet());

	const corsOrigins = configService.getOrThrow<string[]>('app.corsOrigins');
	app.enableCors({
		origin: corsOrigins,
		methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
		allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-Id', 'Idempotency-Key'],
		credentials: false
	});

	app.setGlobalPrefix(API_PREFIX);
	app.enableVersioning({
		type: VersioningType.URI,
		defaultVersion: API_VERSION
	});
	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true
		})
	);

	const swaggerDocument = createSwaggerDocument(app, configService);
	SwaggerModule.setup(configService.getOrThrow<string>('swagger.docsPath'), app, swaggerDocument, {
		jsonDocumentUrl: configService.getOrThrow<string>('swagger.jsonPath')
	});

	const port = configService.getOrThrow<number>('app.port');
	await app.listen(port);
	logger.log(`E-commerce API is running on port ${port}`);
}

void bootstrap();
