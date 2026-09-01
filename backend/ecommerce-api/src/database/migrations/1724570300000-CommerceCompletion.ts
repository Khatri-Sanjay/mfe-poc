import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommerceCompletion1724570300000 implements MigrationInterface {
	name = 'CommerceCompletion1724570300000';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE coupon_type_enum AS ENUM ('PERCENTAGE', 'FIXED_AMOUNT')`);
		await queryRunner.query(
			`CREATE TYPE order_status_enum AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED')`
		);
		await queryRunner.query(
			`CREATE TYPE payment_status_enum AS ENUM ('PENDING', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'PARTIALLY_REFUNDED', 'REFUNDED')`
		);
		await queryRunner.query(`CREATE TYPE refund_status_enum AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED')`);
		await queryRunner.query(`CREATE TYPE review_status_enum AS ENUM ('PENDING', 'APPROVED', 'REJECTED')`);

		await queryRunner.query(`
      CREATE TABLE addresses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        company varchar(160),
        address_line_1 varchar(255) NOT NULL,
        address_line_2 varchar(255),
        city varchar(120) NOT NULL,
        state varchar(120),
        postal_code varchar(40) NOT NULL,
        country_code char(2) NOT NULL,
        phone varchar(30),
        is_default_shipping boolean NOT NULL DEFAULT false,
        is_default_billing boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_addresses_user_id ON addresses(user_id)`);

		await queryRunner.query(`
      CREATE TABLE shipping_methods (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(160) NOT NULL,
        code varchar(80) NOT NULL UNIQUE,
        description varchar(500),
        price numeric(12,2) NOT NULL CHECK (price >= 0),
        currency char(3) NOT NULL DEFAULT 'AUD',
        estimated_min_days integer NOT NULL CHECK (estimated_min_days >= 0),
        estimated_max_days integer NOT NULL CHECK (estimated_max_days >= estimated_min_days),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

		await queryRunner.query(`
      CREATE TABLE coupons (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        code varchar(80) NOT NULL UNIQUE,
        type coupon_type_enum NOT NULL,
        value numeric(12,2) NOT NULL CHECK (value >= 0),
        minimum_order_amount numeric(12,2) CHECK (minimum_order_amount IS NULL OR minimum_order_amount >= 0),
        maximum_discount_amount numeric(12,2) CHECK (maximum_discount_amount IS NULL OR maximum_discount_amount >= 0),
        starts_at timestamptz,
        expires_at timestamptz,
        usage_limit integer CHECK (usage_limit IS NULL OR usage_limit > 0),
        usage_count integer NOT NULL DEFAULT 0 CHECK (usage_count >= 0),
        usage_limit_per_user integer CHECK (usage_limit_per_user IS NULL OR usage_limit_per_user > 0),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

		await queryRunner.query(`
      CREATE TABLE carts (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        coupon_id uuid REFERENCES coupons(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_carts_user_id_unique ON carts(user_id)`);

		await queryRunner.query(`
      CREATE TABLE cart_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id uuid NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
        variant_id uuid NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
        quantity integer NOT NULL CHECK (quantity > 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_cart_items_cart_variant UNIQUE (cart_id, variant_id)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id)`);

		await queryRunner.query(`
      CREATE TABLE wishlist_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_wishlist_items_user_product UNIQUE (user_id, product_id)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_wishlist_items_user_id ON wishlist_items(user_id)`);

		await queryRunner.query(`
      CREATE TABLE idempotency_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        key varchar(120) NOT NULL UNIQUE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        operation varchar(80) NOT NULL,
        response jsonb NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_idempotency_records_user_operation ON idempotency_records(user_id, operation)`);

		await queryRunner.query(`
      CREATE TABLE orders (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
        status order_status_enum NOT NULL,
        subtotal numeric(12,2) NOT NULL CHECK (subtotal >= 0),
        discount_total numeric(12,2) NOT NULL CHECK (discount_total >= 0),
        shipping_total numeric(12,2) NOT NULL CHECK (shipping_total >= 0),
        tax_total numeric(12,2) NOT NULL CHECK (tax_total >= 0),
        grand_total numeric(12,2) NOT NULL CHECK (grand_total >= 0),
        currency char(3) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_orders_user_id ON orders(user_id)`);

		await queryRunner.query(`
      CREATE TABLE order_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id uuid NOT NULL,
        variant_id uuid NOT NULL,
        product_name varchar(220) NOT NULL,
        sku varchar(120) NOT NULL,
        variant_options jsonb NOT NULL DEFAULT '{}'::jsonb,
        unit_price numeric(12,2) NOT NULL,
        quantity integer NOT NULL CHECK (quantity > 0),
        line_total numeric(12,2) NOT NULL,
        currency char(3) NOT NULL
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_order_items_order_id ON order_items(order_id)`);

		await queryRunner.query(`
      CREATE TABLE order_addresses (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        type varchar(20) NOT NULL,
        snapshot jsonb NOT NULL
      )
    `);

		await queryRunner.query(`
      CREATE TABLE order_status_history (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        from_status order_status_enum,
        to_status order_status_enum NOT NULL,
        note varchar(500),
        changed_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

		await queryRunner.query(`
      CREATE TABLE payments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        provider varchar(60) NOT NULL,
        provider_payment_id varchar(160) NOT NULL,
        amount numeric(12,2) NOT NULL CHECK (amount >= 0),
        currency char(3) NOT NULL,
        status payment_status_enum NOT NULL,
        failure_code varchar(120),
        failure_message varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_payments_order_id ON payments(order_id)`);

		await queryRunner.query(`
      CREATE TABLE refunds (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id uuid NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
        order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        amount numeric(12,2) NOT NULL CHECK (amount > 0),
        reason varchar(500) NOT NULL,
        provider_refund_id varchar(160) NOT NULL,
        status refund_status_enum NOT NULL,
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_refunds_payment_id ON refunds(payment_id)`);

		await queryRunner.query(`
      CREATE TABLE reviews (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
        title varchar(160) NOT NULL,
        comment text,
        status review_status_enum NOT NULL DEFAULT 'PENDING',
        verified_purchase boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT uq_reviews_user_product UNIQUE (user_id, product_id)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_reviews_product_id ON reviews(product_id)`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP TABLE IF EXISTS reviews');
		await queryRunner.query('DROP TABLE IF EXISTS refunds');
		await queryRunner.query('DROP TABLE IF EXISTS payments');
		await queryRunner.query('DROP TABLE IF EXISTS order_status_history');
		await queryRunner.query('DROP TABLE IF EXISTS order_addresses');
		await queryRunner.query('DROP TABLE IF EXISTS order_items');
		await queryRunner.query('DROP TABLE IF EXISTS orders');
		await queryRunner.query('DROP TABLE IF EXISTS idempotency_records');
		await queryRunner.query('DROP TABLE IF EXISTS wishlist_items');
		await queryRunner.query('DROP TABLE IF EXISTS cart_items');
		await queryRunner.query('DROP TABLE IF EXISTS carts');
		await queryRunner.query('DROP TABLE IF EXISTS coupons');
		await queryRunner.query('DROP TABLE IF EXISTS shipping_methods');
		await queryRunner.query('DROP TABLE IF EXISTS addresses');
		await queryRunner.query('DROP TYPE IF EXISTS review_status_enum');
		await queryRunner.query('DROP TYPE IF EXISTS refund_status_enum');
		await queryRunner.query('DROP TYPE IF EXISTS payment_status_enum');
		await queryRunner.query('DROP TYPE IF EXISTS order_status_enum');
		await queryRunner.query('DROP TYPE IF EXISTS coupon_type_enum');
	}
}
