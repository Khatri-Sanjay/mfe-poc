import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';
import appConfig from './config/app.config';
import authConfig from './config/auth.config';
import databaseConfig from './config/database.config';
import swaggerConfig from './config/swagger.config';
import { envValidationSchema } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { HealthModule } from './modules/health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './modules/auth/guards/roles.guard';
import { PermissionsGuard } from './modules/auth/guards/permissions.guard';
import { CategoriesModule } from './modules/categories/categories.module';
import { BrandsModule } from './modules/brands/brands.module';
import { ProductsModule } from './modules/products/products.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { AddressesModule } from './modules/addresses/addresses.module';
import { CartsModule } from './modules/carts/carts.module';
import { CheckoutModule } from './modules/checkout/checkout.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { IdempotencyModule } from './modules/idempotency/idempotency.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { RefundsModule } from './modules/refunds/refunds.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { WishlistsModule } from './modules/wishlists/wishlists.module';
import { ProductComparisonModule } from './modules/product-comparison/product-comparison.module';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			cache: true,
			expandVariables: true,
			load: [appConfig, authConfig, databaseConfig, swaggerConfig],
			validationSchema: envValidationSchema,
			validationOptions: {
				abortEarly: false
			}
		}),
		LoggerModule.forRoot({
			pinoHttp: {
				level: process.env.LOG_LEVEL ?? 'info',
				genReqId: (request) => request.id,
				redact: {
					paths: [
						'req.headers.authorization',
						'req.headers.cookie',
						'req.body.password',
						'req.body.accessToken',
						'req.body.refreshToken',
						'req.body.resetToken'
					],
					censor: '[REDACTED]'
				},
				customProps: (request) => ({
					requestId: request.id
				}),
				customSuccessMessage: (request, response) => `${request.method} ${request.url} ${response.statusCode}`,
				customErrorMessage: (request, response) => `${request.method} ${request.url} ${response.statusCode}`
			}
		}),
		ThrottlerModule.forRoot([
			{
				ttl: Number(process.env.THROTTLE_TTL ?? 60000),
				limit: Number(process.env.THROTTLE_LIMIT ?? 100)
			}
		]),
		DatabaseModule,
		AuthModule,
		UsersModule,
		CategoriesModule,
		BrandsModule,
		ProductsModule,
		InventoryModule,
		AddressesModule,
		DiscountsModule,
		ShippingModule,
		CartsModule,
		WishlistsModule,
		IdempotencyModule,
		PaymentsModule,
		RefundsModule,
		OrdersModule,
		CheckoutModule,
		ReviewsModule,
		ProductComparisonModule,
		HealthModule
	],
	providers: [
		{
			provide: APP_GUARD,
			useClass: ThrottlerGuard
		},
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard
		},
		{
			provide: APP_GUARD,
			useClass: RolesGuard
		},
		{
			provide: APP_GUARD,
			useClass: PermissionsGuard
		},
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor
		},
		{
			provide: APP_FILTER,
			useClass: HttpExceptionFilter
		}
	]
})
export class AppModule implements NestModule {
	configure(consumer: MiddlewareConsumer): void {
		consumer.apply(RequestIdMiddleware).forRoutes('*path');
	}
}
