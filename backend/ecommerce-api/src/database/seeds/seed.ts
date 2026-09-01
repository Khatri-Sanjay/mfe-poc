import { config } from 'dotenv';
import { Client } from 'pg';
import * as argon2 from 'argon2';

config();

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
	'review.manage',
	'report.read'
];

const rolePermissions = new Map<string, string[]>([
	['CUSTOMER', []],
	[
		'ADMIN',
		[
			'product.read',
			'product.create',
			'product.update',
			'category.manage',
			'brand.manage',
			'inventory.read',
			'inventory.manage',
			'order.read',
			'order.manage',
			'order.refund',
			'user.read',
			'discount.manage',
			'review.manage',
			'report.read'
		]
	],
	['SUPER_ADMIN', permissions]
]);

const hashPassword = (password: string): Promise<string> =>
	argon2.hash(password, {
		type: argon2.argon2id,
		memoryCost: 65536,
		timeCost: 3,
		parallelism: 1
	});

const run = async (): Promise<void> => {
	if (!process.env.DATABASE_URL) {
		throw new Error('DATABASE_URL is required to run seeds');
	}

	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();

	try {
		await client.query('BEGIN');

		for (const permission of permissions) {
			await client.query(
				`
          INSERT INTO permissions (name, description)
          VALUES ($1, $2)
          ON CONFLICT (name)
          DO UPDATE SET description = EXCLUDED.description, updated_at = now()
        `,
				[permission, `Allows ${permission}`]
			);
		}

		for (const [role, rolePermissionNames] of rolePermissions.entries()) {
			const roleResult = await client.query<{ id: string }>(
				`
          INSERT INTO roles (name, description)
          VALUES ($1, $2)
          ON CONFLICT (name)
          DO UPDATE SET description = EXCLUDED.description, updated_at = now()
          RETURNING id
        `,
				[role, `${role} role`]
			);
			const roleId = roleResult.rows[0].id;

			await client.query('DELETE FROM role_permissions WHERE role_id = $1', [roleId]);

			for (const permissionName of rolePermissionNames) {
				await client.query(
					`
            INSERT INTO role_permissions (role_id, permission_id)
            SELECT $1, id FROM permissions WHERE name = $2
            ON CONFLICT DO NOTHING
          `,
					[roleId, permissionName]
				);
			}
		}

		if (process.env.DEV_ADMIN_EMAIL && process.env.DEV_ADMIN_PASSWORD) {
			const adminEmail = process.env.DEV_ADMIN_EMAIL.trim().toLowerCase();
			const passwordHash = await hashPassword(process.env.DEV_ADMIN_PASSWORD);
			const adminResult = await client.query<{ id: string }>(
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
          VALUES ('Development', 'Admin', $1, $2, 'ACTIVE', true, now())
          ON CONFLICT (email)
          DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            status = 'ACTIVE',
            email_verified = true,
            email_verified_at = COALESCE(users.email_verified_at, now()),
            updated_at = now()
          RETURNING id
        `,
				[adminEmail, passwordHash]
			);

			await client.query(
				`
          INSERT INTO user_roles (user_id, role_id)
          SELECT $1, id FROM roles WHERE name = 'SUPER_ADMIN'
          ON CONFLICT DO NOTHING
        `,
				[adminResult.rows[0].id]
			);
		}

		const electronicsId = await upsertCategory(client, {
			name: 'Electronics',
			slug: 'electronics',
			description: 'Devices, accessories, and consumer electronics.',
			sortOrder: 10
		});
		const phonesId = await upsertCategory(client, {
			name: 'Phones',
			slug: 'phones',
			description: 'Smartphones and mobile devices.',
			parentId: electronicsId,
			sortOrder: 20
		});
		const accessoriesId = await upsertCategory(client, {
			name: 'Accessories',
			slug: 'accessories',
			description: 'Chargers, cases, and everyday add-ons.',
			parentId: electronicsId,
			sortOrder: 30
		});
		const appleId = await upsertBrand(client, {
			name: 'Apple',
			slug: 'apple',
			description: 'Consumer technology products.',
			websiteUrl: 'https://www.apple.com'
		});

		await upsertProduct(client, {
			name: 'iPhone 17 Pro',
			slug: 'iphone-17-pro',
			description: 'A sample flagship smartphone for development catalog flows.',
			shortDescription: 'Sample flagship smartphone.',
			brandId: appleId,
			categoryIds: [phonesId, accessoriesId],
			sku: 'IPHONE17PRO-128-BLK',
			variantName: '128GB Black',
			price: '1999.00',
			currency: 'AUD',
			quantityOnHand: 25,
			imageUrl: 'https://example.com/images/iphone-17-pro.jpg'
		});

		await upsertShippingMethod(client, {
			name: 'Standard Shipping',
			code: 'STANDARD',
			description: 'Reliable standard delivery.',
			price: '10.00',
			currency: 'AUD',
			estimatedMinDays: 3,
			estimatedMaxDays: 7
		});
		await upsertShippingMethod(client, {
			name: 'Express Shipping',
			code: 'EXPRESS',
			description: 'Faster delivery for urgent orders.',
			price: '25.00',
			currency: 'AUD',
			estimatedMinDays: 1,
			estimatedMaxDays: 3
		});
		await upsertCoupon(client, {
			code: 'SAVE10',
			type: 'PERCENTAGE',
			value: '10.00',
			maximumDiscountAmount: '100.00'
		});

		await client.query('COMMIT');
		console.log('Seed completed successfully.');
	} catch (error) {
		await client.query('ROLLBACK');
		throw error;
	} finally {
		await client.end();
	}
};

void run();

interface CategorySeed {
	name: string;
	slug: string;
	description: string;
	parentId?: string;
	sortOrder: number;
}

interface BrandSeed {
	name: string;
	slug: string;
	description: string;
	websiteUrl: string;
}

interface ProductSeed {
	name: string;
	slug: string;
	description: string;
	shortDescription: string;
	brandId: string;
	categoryIds: string[];
	sku: string;
	variantName: string;
	price: string;
	currency: string;
	quantityOnHand: number;
	imageUrl: string;
}

interface ShippingMethodSeed {
	name: string;
	code: string;
	description: string;
	price: string;
	currency: string;
	estimatedMinDays: number;
	estimatedMaxDays: number;
}

interface CouponSeed {
	code: string;
	type: 'PERCENTAGE' | 'FIXED_AMOUNT';
	value: string;
	maximumDiscountAmount?: string;
}

const upsertCategory = async (client: Client, seed: CategorySeed): Promise<string> => {
	const result = await client.query<{ id: string }>(
		`
      INSERT INTO categories (
        name,
        slug,
        description,
        parent_id,
        is_active,
        sort_order
      )
      VALUES ($1, $2, $3, $4, true, $5)
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        parent_id = EXCLUDED.parent_id,
        is_active = true,
        sort_order = EXCLUDED.sort_order,
        updated_at = now()
      RETURNING id
    `,
		[seed.name, seed.slug, seed.description, seed.parentId ?? null, seed.sortOrder]
	);
	return result.rows[0].id;
};

const upsertBrand = async (client: Client, seed: BrandSeed): Promise<string> => {
	const result = await client.query<{ id: string }>(
		`
      INSERT INTO brands (name, slug, description, website_url, is_active)
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        website_url = EXCLUDED.website_url,
        is_active = true,
        updated_at = now()
      RETURNING id
    `,
		[seed.name, seed.slug, seed.description, seed.websiteUrl]
	);
	return result.rows[0].id;
};

const upsertProduct = async (client: Client, seed: ProductSeed): Promise<void> => {
	const productResult = await client.query<{ id: string }>(
		`
      INSERT INTO products (
        name,
        slug,
        description,
        short_description,
        brand_id,
        status
      )
      VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
      ON CONFLICT (slug)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        short_description = EXCLUDED.short_description,
        brand_id = EXCLUDED.brand_id,
        status = 'ACTIVE',
        updated_at = now()
      RETURNING id
    `,
		[seed.name, seed.slug, seed.description, seed.shortDescription, seed.brandId]
	);
	const productId = productResult.rows[0].id;

	await client.query('DELETE FROM product_categories WHERE product_id = $1', [productId]);
	for (const categoryId of seed.categoryIds) {
		await client.query(
			`
        INSERT INTO product_categories (product_id, category_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
			[productId, categoryId]
		);
	}

	await client.query(
		`
      INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
      VALUES ($1, $2, $3, 0, true)
      ON CONFLICT DO NOTHING
    `,
		[productId, seed.imageUrl, seed.name]
	);

	const variantResult = await client.query<{ id: string }>(
		`
      INSERT INTO product_variants (
        product_id,
        sku,
        name,
        options,
        price,
        currency,
        is_active
      )
      VALUES ($1, $2, $3, '{}'::jsonb, $4, $5, true)
      ON CONFLICT (sku)
      DO UPDATE SET
        product_id = EXCLUDED.product_id,
        name = EXCLUDED.name,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        is_active = true,
        updated_at = now()
      RETURNING id
    `,
		[productId, seed.sku, seed.variantName, seed.price, seed.currency]
	);

	await client.query(
		`
      INSERT INTO inventory_items (
        variant_id,
        quantity_on_hand,
        quantity_reserved,
        reorder_level
      )
      VALUES ($1, $2, 0, 5)
      ON CONFLICT (variant_id)
      DO UPDATE SET
        quantity_on_hand = EXCLUDED.quantity_on_hand,
        quantity_reserved = 0,
        reorder_level = EXCLUDED.reorder_level,
        updated_at = now()
    `,
		[variantResult.rows[0].id, seed.quantityOnHand]
	);
};

const upsertShippingMethod = async (client: Client, seed: ShippingMethodSeed): Promise<void> => {
	await client.query(
		`
      INSERT INTO shipping_methods (
        name,
        code,
        description,
        price,
        currency,
        estimated_min_days,
        estimated_max_days,
        is_active
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT (code)
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        price = EXCLUDED.price,
        currency = EXCLUDED.currency,
        estimated_min_days = EXCLUDED.estimated_min_days,
        estimated_max_days = EXCLUDED.estimated_max_days,
        is_active = true,
        updated_at = now()
    `,
		[seed.name, seed.code, seed.description, seed.price, seed.currency, seed.estimatedMinDays, seed.estimatedMaxDays]
	);
};

const upsertCoupon = async (client: Client, seed: CouponSeed): Promise<void> => {
	await client.query(
		`
      INSERT INTO coupons (
        code,
        type,
        value,
        maximum_discount_amount,
        is_active
      )
      VALUES ($1, $2, $3, $4, true)
      ON CONFLICT (code)
      DO UPDATE SET
        type = EXCLUDED.type,
        value = EXCLUDED.value,
        maximum_discount_amount = EXCLUDED.maximum_discount_amount,
        is_active = true,
        updated_at = now()
    `,
		[seed.code, seed.type, seed.value, seed.maximumDiscountAmount ?? null]
	);
};
