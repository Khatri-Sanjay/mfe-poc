import { MigrationInterface, QueryRunner } from 'typeorm';

export class CatalogAndInventory1724570200000 implements MigrationInterface {
	name = 'CatalogAndInventory1724570200000';

	async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query(`CREATE TYPE product_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED')`);
		await queryRunner.query(
			`CREATE TYPE inventory_transaction_type_enum AS ENUM ('STOCK_IN', 'STOCK_OUT', 'RESERVATION', 'RESERVATION_RELEASE', 'SALE', 'RETURN', 'ADJUSTMENT')`
		);
		await queryRunner.query(`
      CREATE TABLE categories (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(160) NOT NULL,
        slug varchar(180) NOT NULL UNIQUE,
        description text,
        parent_id uuid REFERENCES categories(id) ON DELETE SET NULL,
        image_url varchar(2048),
        is_active boolean NOT NULL DEFAULT true,
        sort_order integer NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_categories_slug_unique ON categories(slug)`);
		await queryRunner.query(`CREATE INDEX idx_categories_parent_id ON categories(parent_id)`);
		await queryRunner.query(`CREATE INDEX idx_categories_active_sort ON categories(is_active, sort_order)`);
		await queryRunner.query(`
      CREATE TABLE brands (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(160) NOT NULL,
        slug varchar(180) NOT NULL UNIQUE,
        description text,
        logo_url varchar(2048),
        website_url varchar(2048),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_brands_slug_unique ON brands(slug)`);
		await queryRunner.query(`CREATE INDEX idx_brands_active ON brands(is_active)`);
		await queryRunner.query(`
      CREATE TABLE products (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(220) NOT NULL,
        slug varchar(240) NOT NULL UNIQUE,
        description text,
        short_description varchar(500),
        brand_id uuid REFERENCES brands(id) ON DELETE SET NULL,
        status product_status_enum NOT NULL DEFAULT 'DRAFT',
        seo_title varchar(255),
        seo_description varchar(500),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_products_slug_unique ON products(slug)`);
		await queryRunner.query(`CREATE INDEX idx_products_brand_id ON products(brand_id)`);
		await queryRunner.query(`CREATE INDEX idx_products_status_created_at ON products(status, created_at)`);
		await queryRunner.query(`
      CREATE TABLE product_categories (
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
        CONSTRAINT pk_product_categories PRIMARY KEY (product_id, category_id)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_product_categories_product_id ON product_categories(product_id)`);
		await queryRunner.query(`CREATE INDEX idx_product_categories_category_id ON product_categories(category_id)`);
		await queryRunner.query(`
      CREATE TABLE product_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        url varchar(2048) NOT NULL,
        alt_text varchar(255),
        sort_order integer NOT NULL DEFAULT 0,
        is_primary boolean NOT NULL DEFAULT false,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_product_images_product_id ON product_images(product_id)`);
		await queryRunner.query(`
      CREATE TABLE product_variants (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        sku varchar(120) NOT NULL UNIQUE,
        barcode varchar(120),
        name varchar(180) NOT NULL,
        options jsonb NOT NULL DEFAULT '{}'::jsonb,
        price numeric(12,2) NOT NULL CHECK (price >= 0),
        compare_at_price numeric(12,2) CHECK (compare_at_price IS NULL OR compare_at_price >= 0),
        cost_price numeric(12,2) CHECK (cost_price IS NULL OR cost_price >= 0),
        currency char(3) NOT NULL DEFAULT 'AUD',
        weight numeric(10,3),
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE UNIQUE INDEX idx_product_variants_sku_unique ON product_variants(sku)`);
		await queryRunner.query(`CREATE INDEX idx_product_variants_product_id ON product_variants(product_id)`);
		await queryRunner.query(`CREATE INDEX idx_product_variants_price ON product_variants(price)`);
		await queryRunner.query(`
      CREATE TABLE inventory_items (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        variant_id uuid NOT NULL UNIQUE REFERENCES product_variants(id) ON DELETE CASCADE,
        quantity_on_hand integer NOT NULL DEFAULT 0,
        quantity_reserved integer NOT NULL DEFAULT 0,
        reorder_level integer NOT NULL DEFAULT 0,
        updated_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_inventory_non_negative CHECK (quantity_on_hand >= 0 AND quantity_reserved >= 0),
        CONSTRAINT chk_inventory_reserved_lte_on_hand CHECK (quantity_reserved <= quantity_on_hand)
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_inventory_items_variant_id ON inventory_items(variant_id)`);
		await queryRunner.query(`
      CREATE TABLE inventory_transactions (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        inventory_item_id uuid NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
        type inventory_transaction_type_enum NOT NULL,
        quantity_delta integer NOT NULL,
        note varchar(500),
        created_by uuid REFERENCES users(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);
		await queryRunner.query(`CREATE INDEX idx_inventory_transactions_inventory_item_id ON inventory_transactions(inventory_item_id)`);
	}

	async down(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.query('DROP TABLE IF EXISTS inventory_transactions');
		await queryRunner.query('DROP TABLE IF EXISTS inventory_items');
		await queryRunner.query('DROP TABLE IF EXISTS product_variants');
		await queryRunner.query('DROP TABLE IF EXISTS product_images');
		await queryRunner.query('DROP TABLE IF EXISTS product_categories');
		await queryRunner.query('DROP TABLE IF EXISTS products');
		await queryRunner.query('DROP TABLE IF EXISTS brands');
		await queryRunner.query('DROP TABLE IF EXISTS categories');
		await queryRunner.query('DROP TYPE IF EXISTS inventory_transaction_type_enum');
		await queryRunner.query('DROP TYPE IF EXISTS product_status_enum');
	}
}
