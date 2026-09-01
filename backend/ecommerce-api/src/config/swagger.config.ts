import { registerAs } from '@nestjs/config';
import { ConfigService } from '@nestjs/config';
import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export default registerAs('swagger', () => ({
	title: 'E-commerce Backend API',
	description: 'Production-oriented REST API contract for the e-commerce Angular Micro Frontends.',
	version: '1.0.0',
	docsPath: 'api/docs',
	jsonPath: 'api/docs-json'
}));

export const createSwaggerDocument = (app: INestApplication, configService: ConfigService) => {
	const config = new DocumentBuilder()
		.setTitle(configService.getOrThrow<string>('swagger.title'))
		.setDescription(configService.getOrThrow<string>('swagger.description'))
		.setVersion(configService.getOrThrow<string>('swagger.version'))
		.addBearerAuth(
			{
				type: 'http',
				scheme: 'bearer',
				bearerFormat: 'JWT',
				in: 'header'
			},
			'bearer'
		)
		.addServer('/api/v1', 'Version 1')
		.build();

	return SwaggerModule.createDocument(app, config);
};
