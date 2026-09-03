import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Client } from 'pg';
import request from 'supertest';
import { App } from 'supertest/types';

jest.setTimeout(30000);

interface WrappedHealthResponse {
	timestamp: string;
}

interface WrappedResponse<TData> {
	data: TData;
}

interface AuthResponseData {
	accessToken: string;
	refreshToken: string;
	accessTokenExpiresIn: number;
	tokenType: string;
	user: {
		email: string;
		roles: string[];
		passwordHash?: string;
	};
}

interface TokenResponseData {
	accessToken: string;
	refreshToken: string;
}

interface UserResponseData {
	email: string;
}

interface ProductResponseData {
	id: string;
	slug: string;
	variants: Array<{ id: string; sku: string; quantityAvailable: number }>;
}

interface ProductComparisonResponseData {
	product: { id: string; name: string; currency: string };
	summary: {
		currency: string;
		lowestPrice: number;
		averagePrice: number;
		potentialSavingVsAverage: number;
		offersCount: number;
	};
	recommendations: {
		bestOverall?: { store: string; offerId: string; score: number; reason: string[] };
		bestLocal?: { store: string; offerId: string; score: number };
	};
	priceAnalysis: { recommendation: string; priceRange: { min: number; max: number } };
	regionalAnalysis: Array<{ countryCode: string; lowestPrice: number; offerCount: number }>;
	offers: Array<{
		id: string;
		pricing: {
			original: { amount: number; currency: string };
			shipping: { amount: number; currency: string };
			total: { amount: number; currency: string };
			converted: { currency: string; total: number };
		};
		dealScore: { score: number; label: string };
		match: { confidence: number; status: string };
	}>;
	report: { headline: string; recommendation: string; warnings: string[] };
	metadata: { historyAvailable: boolean; targetCurrency: string };
	market: { lowestPriceNpr: number; potentialSaving: number };
}

interface PaginatedResponse<TData> {
	data: TData[];
	meta: { total: number };
}

interface InventoryResponseData {
	variantId: string;
	quantityOnHand: number;
	quantityAvailable: number;
}

interface AddressResponseData {
	id: string;
}

interface ShippingMethodResponseData {
	id: string;
	code: string;
}

interface CartResponseData {
	items: Array<{ id: string; variantId: string; quantity: number }>;
	subtotal: string;
	discountTotal: string;
	grandTotal: string;
}

interface CheckoutResponseData {
	order: { id: string; status: string; grandTotal: string };
	payment: { id: string; status: string };
}

interface ReviewResponseData {
	id: string;
	verifiedPurchase: boolean;
}

interface AuthData {
	accessToken: string;
	refreshToken: string;
}

describe('Foundation and auth endpoints (e2e)', () => {
	let app: INestApplication<App>;
	let authData: AuthData;
	let adminAccessToken: string;
	let createdProduct: ProductResponseData;

	beforeAll(async () => {
		process.env.NODE_ENV = 'test';
		process.env.DATABASE_URL =
			process.env.TEST_DATABASE_URL ?? 'postgresql://ecommerce:ecommerce_password@127.0.0.1:5433/ecommerce_api_test';

		await resetTestDatabase(process.env.DATABASE_URL);
		const { AppModule } = jest.requireActual<typeof import('../src/app.module')>('../src/app.module');

		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule]
		}).compile();

		app = moduleFixture.createNestApplication();
		app.setGlobalPrefix('api');
		app.enableVersioning({
			type: VersioningType.URI,
			defaultVersion: '1'
		});
		app.useGlobalPipes(
			new ValidationPipe({
				whitelist: true,
				forbidNonWhitelisted: true,
				transform: true
			})
		);
		await app.init();
		await seedAuthorization(process.env.DATABASE_URL);
		adminAccessToken = await loginAdmin(app);
	});

	afterAll(async () => {
		await app?.close();
	});

	it('wraps health responses with the global contract and request id', async () => {
		const response = await request(app.getHttpServer()).get('/api/v1/health').set('X-Request-Id', 'test-request-id').expect(200);

		expect(response.headers['x-request-id']).toBe('test-request-id');
		expect(response.body).toMatchObject({
			success: true,
			statusCode: 200,
			message: 'Service health retrieved successfully',
			path: '/api/v1/health',
			requestId: 'test-request-id',
			data: {
				status: 'ok',
				service: 'ecommerce-api',
				environment: 'test',
				checks: {
					http: 'ok',
					database: 'ok'
				}
			}
		});
		const body = response.body as WrappedHealthResponse;
		expect(body.timestamp).toEqual(expect.any(String));
	});

	it('registers a customer and returns tokens without sensitive fields', async () => {
		const response = await request(app.getHttpServer())
			.post('/api/v1/auth/register')
			.send({
				firstName: 'Jane',
				lastName: 'Customer',
				email: 'jane.customer@example.com',
				password: 'Strong-password-123'
			})
			.expect(201);

		const body = response.body as WrappedResponse<AuthResponseData>;

		expect(body.data).toMatchObject({
			tokenType: 'Bearer',
			accessTokenExpiresIn: 900,
			user: {
				email: 'jane.customer@example.com',
				roles: ['CUSTOMER']
			}
		});
		expect(body.data.user.passwordHash).toBeUndefined();

		authData = {
			accessToken: body.data.accessToken,
			refreshToken: body.data.refreshToken
		};
	});

	it('rejects duplicate registration email', async () => {
		await request(app.getHttpServer())
			.post('/api/v1/auth/register')
			.send({
				firstName: 'Jane',
				lastName: 'Customer',
				email: 'jane.customer@example.com',
				password: 'Strong-password-123'
			})
			.expect(409);
	});

	it('rejects invalid login credentials', async () => {
		await request(app.getHttpServer())
			.post('/api/v1/auth/login')
			.send({
				email: 'jane.customer@example.com',
				password: 'Wrong-password-123'
			})
			.expect(401);
	});

	it('allows access to protected me endpoint with bearer token', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/v1/auth/me')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.expect(200);

		const body = response.body as WrappedResponse<UserResponseData>;
		expect(body.data.email).toBe('jane.customer@example.com');
	});

	it('rotates refresh tokens and rejects the old refresh token', async () => {
		const refreshResponse = await request(app.getHttpServer())
			.post('/api/v1/auth/refresh')
			.send({ refreshToken: authData.refreshToken })
			.expect(201);

		const body = refreshResponse.body as WrappedResponse<TokenResponseData>;
		const oldRefreshToken = authData.refreshToken;
		authData = {
			accessToken: body.data.accessToken,
			refreshToken: body.data.refreshToken
		};

		await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: oldRefreshToken }).expect(401);
	});

	it('revokes a session on logout', async () => {
		await request(app.getHttpServer()).post('/api/v1/auth/logout').send({ refreshToken: authData.refreshToken }).expect(201);

		await request(app.getHttpServer()).post('/api/v1/auth/refresh').send({ refreshToken: authData.refreshToken }).expect(401);
	});

	it('denies customer access to admin user APIs', async () => {
		await request(app.getHttpServer()).get('/api/v1/admin/users').set('Authorization', `Bearer ${authData.accessToken}`).expect(403);
	});

	it('creates category, brand, product, variant, image, and inventory records as admin', async () => {
		const categoryResponse = await request(app.getHttpServer())
			.post('/api/v1/admin/categories')
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({ name: 'Phones', slug: 'phones', sortOrder: 1 })
			.expect(201);
		const category = categoryResponse.body as WrappedResponse<{ id: string }>;

		const brandResponse = await request(app.getHttpServer())
			.post('/api/v1/admin/brands')
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({ name: 'Apple', slug: 'apple', websiteUrl: 'https://apple.test' })
			.expect(201);
		const brand = brandResponse.body as WrappedResponse<{ id: string }>;

		const productResponse = await request(app.getHttpServer())
			.post('/api/v1/admin/products')
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({
				name: 'iPhone Test',
				slug: 'iphone-test',
				description: 'A test phone',
				shortDescription: 'Test phone',
				brandId: brand.data.id,
				categoryIds: [category.data.id],
				status: 'ACTIVE',
				images: [
					{
						url: 'https://example.com/iphone-test.jpg',
						altText: 'iPhone Test',
						isPrimary: true
					}
				],
				variants: [
					{
						sku: 'IPHONE-TEST-001',
						name: 'Default',
						price: '999.00',
						currency: 'AUD',
						quantityOnHand: 5
					}
				]
			})
			.expect(201);

		const productBody = productResponse.body as WrappedResponse<ProductResponseData>;
		createdProduct = productBody.data;
		expect(createdProduct.slug).toBe('iphone-test');
		expect(createdProduct.variants[0]).toMatchObject({
			sku: 'IPHONE-TEST-001',
			quantityAvailable: 5
		});
	});

	it('rejects duplicate product SKU', async () => {
		await request(app.getHttpServer())
			.post('/api/v1/admin/products')
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({
				name: 'Duplicate SKU Product',
				slug: 'duplicate-sku-product',
				status: 'ACTIVE',
				variants: [
					{
						sku: 'IPHONE-TEST-001',
						name: 'Default',
						price: '999.00',
						currency: 'AUD'
					}
				]
			})
			.expect(409);
	});

	it('lists and filters public products', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/v1/products')
			.query({
				search: 'iphone',
				brand: 'apple',
				category: 'phones',
				inStock: true,
				page: 1,
				limit: 6,
				sortBy: 'price',
				sortOrder: 'asc'
			})
			.expect(200);

		const body = response.body as PaginatedResponse<ProductResponseData>;
		expect(body.meta.total).toBeGreaterThanOrEqual(1);
		expect(body.data.some((product) => product.slug === 'iphone-test')).toBe(true);
	});

	it('returns product intelligence for marketplace search comparisons', async () => {
		const response = await request(app.getHttpServer())
			.get('/api/v1/product-comparison/search/items')
			.query({ query: 'Samsung Galaxy S24' })
			.expect(200);

		const body = response.body as WrappedResponse<ProductComparisonResponseData>;
		expect(body.data.product).toMatchObject({
			id: 'samsung-galaxy-s24',
			name: 'Samsung Galaxy S24',
			currency: 'NPR'
		});
		expect(body.data.summary.currency).toBe('NPR');
		expect(typeof body.data.summary.offersCount).toBe('number');
		expect(typeof body.data.summary.potentialSavingVsAverage).toBe('number');
		expect(body.data.summary.offersCount).toBeGreaterThan(10);
		expect(typeof body.data.recommendations.bestOverall?.store).toBe('string');
		expect(typeof body.data.recommendations.bestOverall?.offerId).toBe('string');
		expect(typeof body.data.recommendations.bestOverall?.score).toBe('number');
		expect(typeof body.data.recommendations.bestLocal?.store).toBe('string');
		expect(typeof body.data.recommendations.bestLocal?.offerId).toBe('string');
		expect(body.data.priceAnalysis.priceRange.min).toBe(body.data.summary.lowestPrice);
		expect(body.data.regionalAnalysis.some((region) => region.countryCode === 'NP')).toBe(true);
		expect(body.data.offers[0]?.pricing.converted.currency).toBe('NPR');
		expect(typeof body.data.offers[0]?.pricing.converted.total).toBe('number');
		expect(typeof body.data.offers[0]?.dealScore.score).toBe('number');
		expect(typeof body.data.offers[0]?.dealScore.label).toBe('string');
		expect(typeof body.data.offers[0]?.match.confidence).toBe('number');
		expect(typeof body.data.offers[0]?.match.status).toBe('string');
		expect(body.data.report.warnings.length).toBeGreaterThan(0);
		expect(body.data.metadata).toMatchObject({
			historyAvailable: false,
			targetCurrency: 'NPR'
		});
		expect(body.data.market.lowestPriceNpr).toBe(body.data.summary.lowestPrice);
	});

	it('retrieves and adjusts inventory as admin', async () => {
		const variantId = createdProduct.variants[0].id;
		const inventoryResponse = await request(app.getHttpServer())
			.get(`/api/v1/admin/inventory/${variantId}`)
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.expect(200);
		const inventory = inventoryResponse.body as WrappedResponse<InventoryResponseData>;
		expect(inventory.data.quantityAvailable).toBe(5);

		const adjustedResponse = await request(app.getHttpServer())
			.post(`/api/v1/admin/inventory/${variantId}/adjustments`)
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({ quantityDelta: 3, note: 'test adjustment' })
			.expect(201);
		const adjusted = adjustedResponse.body as WrappedResponse<InventoryResponseData>;
		expect(adjusted.data.quantityOnHand).toBe(8);
		expect(adjusted.data.quantityAvailable).toBe(8);
	});

	it('supports cart, checkout, idempotent retry, order, review, and refund flows', async () => {
		const shippingResponse = await request(app.getHttpServer())
			.post('/api/v1/admin/shipping/methods')
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({
				name: 'Standard Test',
				code: 'STANDARD_TEST',
				price: '10.00',
				currency: 'AUD',
				estimatedMinDays: 2,
				estimatedMaxDays: 5
			})
			.expect(201);
		const shipping = shippingResponse.body as WrappedResponse<ShippingMethodResponseData>;

		await request(app.getHttpServer())
			.post('/api/v1/admin/coupons')
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({
				code: 'TEST10',
				type: 'PERCENTAGE',
				value: '10.00',
				maximumDiscountAmount: '100.00'
			})
			.expect(201);

		const addressResponse = await request(app.getHttpServer())
			.post('/api/v1/users/me/addresses')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.send({
				firstName: 'Jane',
				lastName: 'Customer',
				addressLine1: '1 Test Street',
				city: 'Sydney',
				postalCode: '2000',
				countryCode: 'AU',
				isDefaultShipping: true,
				isDefaultBilling: true
			})
			.expect(201);
		const address = addressResponse.body as WrappedResponse<AddressResponseData>;

		const cartResponse = await request(app.getHttpServer())
			.post('/api/v1/cart/items')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.send({
				variantId: createdProduct.variants[0].id,
				quantity: 2
			})
			.expect(201);
		const cart = cartResponse.body as WrappedResponse<CartResponseData>;
		expect(cart.data.items[0]).toMatchObject({
			variantId: createdProduct.variants[0].id,
			quantity: 2
		});

		const discountedResponse = await request(app.getHttpServer())
			.post('/api/v1/cart/coupon')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.send({ code: 'TEST10' })
			.expect(201);
		const discounted = discountedResponse.body as WrappedResponse<CartResponseData>;
		expect(discounted.data.discountTotal).toBe('100.00');

		await request(app.getHttpServer())
			.post('/api/v1/checkout/quote')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.send({ shippingMethodId: shipping.data.id })
			.expect(201);

		const idempotencyKey = '00000000-0000-4000-8000-000000000001';
		const checkoutResponse = await request(app.getHttpServer())
			.post('/api/v1/checkout')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.set('Idempotency-Key', idempotencyKey)
			.send({
				shippingAddressId: address.data.id,
				billingAddressId: address.data.id,
				shippingMethodId: shipping.data.id
			})
			.expect(201);
		const checkout = checkoutResponse.body as WrappedResponse<CheckoutResponseData>;
		expect(checkout.data.order.status).toBe('PAID');
		expect(checkout.data.payment.status).toBe('SUCCEEDED');

		const retryResponse = await request(app.getHttpServer())
			.post('/api/v1/checkout')
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.set('Idempotency-Key', idempotencyKey)
			.send({
				shippingAddressId: address.data.id,
				billingAddressId: address.data.id,
				shippingMethodId: shipping.data.id
			})
			.expect(201);
		const retry = retryResponse.body as WrappedResponse<CheckoutResponseData>;
		expect(retry.data.order.id).toBe(checkout.data.order.id);

		await request(app.getHttpServer())
			.get(`/api/v1/orders/${checkout.data.order.id}`)
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.expect(200);

		const reviewResponse = await request(app.getHttpServer())
			.post(`/api/v1/products/${createdProduct.id}/reviews`)
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.send({
				rating: 5,
				title: 'Excellent',
				comment: 'Works well in e2e.'
			})
			.expect(201);
		const review = reviewResponse.body as WrappedResponse<ReviewResponseData>;
		expect(review.data.verifiedPurchase).toBe(true);

		await request(app.getHttpServer())
			.post(`/api/v1/products/${createdProduct.id}/reviews`)
			.set('Authorization', `Bearer ${authData.accessToken}`)
			.send({ rating: 4, title: 'Duplicate' })
			.expect(409);

		await request(app.getHttpServer())
			.post(`/api/v1/admin/orders/${checkout.data.order.id}/refunds`)
			.set('Authorization', `Bearer ${adminAccessToken}`)
			.send({
				amount: '10.00',
				reason: 'Customer accommodation'
			})
			.expect(201);
	});
});

const resetTestDatabase = async (databaseUrl: string): Promise<void> => {
	const target = new URL(databaseUrl);
	const databaseName = target.pathname.replace('/', '');
	const adminUrl = new URL(databaseUrl);
	adminUrl.pathname = '/postgres';

	const adminClient = new Client({ connectionString: adminUrl.toString() });
	await adminClient.connect();
	await adminClient.query(`CREATE DATABASE ${databaseName}`).catch(() => {
		return undefined;
	});
	await adminClient.end();

	const testClient = new Client({ connectionString: databaseUrl });
	await testClient.connect();
	await testClient.query('DROP SCHEMA public CASCADE');
	await testClient.query('CREATE SCHEMA public');
	await testClient.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
	await testClient.end();
};

const seedAuthorization = async (databaseUrl: string): Promise<void> => {
	const client = new Client({ connectionString: databaseUrl });
	await client.connect();
	const permissions = [
		'product.read',
		'product.create',
		'product.update',
		'product.delete',
		'category.manage',
		'brand.manage',
		'inventory.read',
		'inventory.manage',
		'order.read',
		'order.manage',
		'order.refund',
		'user.read',
		'user.manage',
		'discount.manage',
		'review.manage'
	];
	for (const permission of permissions) {
		await client.query(
			`
        INSERT INTO permissions (name, description)
        VALUES ($1, $2)
        ON CONFLICT (name) DO NOTHING
      `,
			[permission, permission]
		);
	}
	await client.query(`
    INSERT INTO roles (name, description)
    VALUES ('CUSTOMER', 'Customer role'), ('SUPER_ADMIN', 'Super admin role')
    ON CONFLICT (name) DO NOTHING
  `);
	await client.query(`
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT roles.id, permissions.id
    FROM roles
    CROSS JOIN permissions
    WHERE roles.name = 'SUPER_ADMIN'
    ON CONFLICT DO NOTHING
  `);
	const passwordHash = await argon2.hash('Development-admin-123', {
		type: argon2.argon2id,
		memoryCost: 65536,
		timeCost: 3,
		parallelism: 1
	});
	await client.query(
		`
    INSERT INTO users (
      first_name,
      last_name,
      email,
      password_hash,
      status,
      email_verified,
      email_verified_at
    )
    VALUES (
      'Test',
      'Admin',
      'admin@example.com',
      $1,
      'ACTIVE',
      true,
      now()
    )
  `,
		[passwordHash]
	);
	await client.query(`
    INSERT INTO user_roles (user_id, role_id)
    SELECT users.id, roles.id
    FROM users
    CROSS JOIN roles
    WHERE users.email = 'admin@example.com' AND roles.name = 'SUPER_ADMIN'
    ON CONFLICT DO NOTHING
  `);
	await client.end();
};

const loginAdmin = async (app: INestApplication<App>): Promise<string> => {
	const response = await request(app.getHttpServer())
		.post('/api/v1/auth/login')
		.send({
			email: 'admin@example.com',
			password: 'Development-admin-123'
		})
		.expect(201);
	const body = response.body as WrappedResponse<AuthResponseData>;
	return body.data.accessToken;
};
