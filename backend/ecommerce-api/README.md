# E-commerce Backend API

Production-oriented NestJS REST API for an e-commerce platform. The API is the backend contract for future independent Angular Micro Frontends: Shell, Catalog, Cart, Checkout, Account, and Admin.

Current implementation status: Phases 1-8 completed for the modular monolith backend.

## Architecture

```text
Angular MFEs
      |
      | REST + Bearer Token
      v
+-------------------------+
|      NestJS API         |
|                         |
| Auth                    |
| Users                   |
| Roles / Permissions     |
| Products                |
| Categories / Brands     |
| Inventory               |
| Cart / Wishlist         |
| Checkout                |
| Orders                  |
| Payments / Refunds      |
| Reviews                 |
+------------+------------+
             |
             v
        PostgreSQL
```

## Implemented Capabilities

- Strict TypeScript NestJS project with ESLint and Prettier
- PostgreSQL through TypeORM with `synchronize: false`
- Explicit migrations for foundation, identity, catalog/inventory, and commerce
- Idempotent development seed for permissions, roles, admin, shipping, coupon, and sample catalog data
- Global `/api/v1` URI versioning
- Global validation pipe, request IDs, success wrapper, and sanitized error filter
- Structured `nestjs-pino` logging with sensitive header/body redaction
- Helmet, environment-driven CORS, and rate limiting
- Swagger UI at `/api/docs` and OpenAPI JSON at `/api/docs-json`
- Health, liveness, and readiness endpoints
- JWT Bearer auth, Argon2id password hashing, rotating hashed refresh tokens, and session revocation
- RBAC plus permission-based guards and admin APIs
- Categories, brands, products, variants, product images, and inventory history
- Public catalog search/filter/sort/pagination
- Product price comparison API with source adapter abstraction and mock market sources
- Addresses, cart, wishlist, shipping methods, and coupons
- Checkout quote and checkout transaction with inventory row locks and idempotency key support
- Immutable orders, order items, address snapshots, and status history
- Payment abstraction with working mock provider
- Refund records with cumulative refund limit enforcement
- Product reviews with duplicate-review protection, verified-purchase detection, and admin moderation
- Dockerfile and Docker Compose PostgreSQL service

## Prerequisites

- Node.js current LTS
- npm
- Docker Desktop or a local PostgreSQL instance

## Environment

Create a local `.env` from `.env.example` and replace secrets before running outside local development.

```bash
cp .env.example .env
```

Important variables:

- `DATABASE_URL`: PostgreSQL connection string. Docker Compose publishes PostgreSQL on host port `5433`.
- `TEST_DATABASE_URL`: isolated PostgreSQL database used by e2e tests.
- `CORS_ORIGINS`: comma-separated allowed frontend origins.
- `JWT_ACCESS_SECRET`: required, at least 32 characters.
- `PAYMENT_PROVIDER`: currently supports `mock`.
- `THROTTLE_TTL` and `THROTTLE_LIMIT`: global rate limit settings.

## Running PostgreSQL

```bash
docker compose up -d postgres
```

## Install

```bash
npm install
```

## Migrations

```bash
npm run migration:show
npm run migration:run
npm run migration:revert
```

Generate a future migration after entity changes:

```bash
npm run migration:generate -- src/database/migrations/DescriptiveName
```

## Seeds

```bash
npm run seed
```

The seed is idempotent and creates permissions, roles, role-permission assignments, optional development admin credentials, standard shipping methods, a sample coupon, and sample catalog data.

## Development

```bash
npm run start:dev
```

Swagger:

- UI: `http://localhost:3000/api/docs`
- JSON: `http://localhost:3000/api/docs-json`

Health:

- `GET /api/v1/health`
- `GET /api/v1/health/live`
- `GET /api/v1/health/ready`

## Main API Areas

Authentication:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/logout-all`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/resend-verification`

Account:

- `GET /api/v1/users/me`
- `PATCH /api/v1/users/me`
- `PATCH /api/v1/users/me/password`
- `GET /api/v1/users/me/addresses`
- `POST /api/v1/users/me/addresses`
- `GET /api/v1/users/me/addresses/:id`
- `PATCH /api/v1/users/me/addresses/:id`
- `DELETE /api/v1/users/me/addresses/:id`
- `GET /api/v1/wishlist`
- `POST /api/v1/wishlist/items`
- `DELETE /api/v1/wishlist/items/:id`
- `DELETE /api/v1/wishlist`

Catalog:

- `GET /api/v1/categories`
- `GET /api/v1/categories/:slug`
- `GET /api/v1/brands`
- `GET /api/v1/brands/:slug`
- `GET /api/v1/products`
- `GET /api/v1/products/:id`
- `GET /api/v1/products/slug/:slug`
- `GET /api/v1/product-comparison/:productId`
- `GET /api/v1/products/:id/reviews`
- `POST /api/v1/products/:id/reviews`
- `PATCH /api/v1/reviews/:id`
- `DELETE /api/v1/reviews/:id`

Cart and checkout:

- `GET /api/v1/cart`
- `POST /api/v1/cart/items`
- `PATCH /api/v1/cart/items/:id`
- `DELETE /api/v1/cart/items/:id`
- `DELETE /api/v1/cart`
- `POST /api/v1/cart/coupon`
- `DELETE /api/v1/cart/coupon`
- `GET /api/v1/shipping/methods`
- `POST /api/v1/checkout/quote`
- `POST /api/v1/checkout` with optional `Idempotency-Key`

Orders and payments:

- `GET /api/v1/orders`
- `GET /api/v1/orders/:id`
- `POST /api/v1/orders/:id/cancel`
- `GET /api/v1/payments/:id`

Admin:

- `GET /api/v1/admin/users`
- `GET /api/v1/admin/users/:id`
- `PATCH /api/v1/admin/users/:id/status`
- `PATCH /api/v1/admin/users/:id/roles`
- `GET /api/v1/admin/products`
- `GET /api/v1/admin/products/:id`
- `POST /api/v1/admin/products`
- `PATCH /api/v1/admin/products/:id`
- `DELETE /api/v1/admin/products/:id`
- `POST /api/v1/admin/products/:id/images`
- `DELETE /api/v1/admin/products/:id/images/:imageId`
- `POST /api/v1/admin/products/:id/variants`
- `PATCH /api/v1/admin/products/:id/variants/:variantId`
- `DELETE /api/v1/admin/products/:id/variants/:variantId`
- `POST /api/v1/admin/categories`
- `PATCH /api/v1/admin/categories/:id`
- `DELETE /api/v1/admin/categories/:id`
- `POST /api/v1/admin/brands`
- `PATCH /api/v1/admin/brands/:id`
- `DELETE /api/v1/admin/brands/:id`
- `GET /api/v1/admin/inventory`
- `GET /api/v1/admin/inventory/:variantId`
- `POST /api/v1/admin/inventory/:variantId/adjustments`
- `GET /api/v1/admin/shipping/methods`
- `POST /api/v1/admin/shipping/methods`
- `PATCH /api/v1/admin/shipping/methods/:id`
- `DELETE /api/v1/admin/shipping/methods/:id`
- `GET /api/v1/admin/coupons`
- `POST /api/v1/admin/coupons`
- `PATCH /api/v1/admin/coupons/:id`
- `DELETE /api/v1/admin/coupons/:id`
- `GET /api/v1/admin/orders`
- `GET /api/v1/admin/orders/:id`
- `PATCH /api/v1/admin/orders/:id/status`
- `POST /api/v1/admin/orders/:id/refunds`
- `GET /api/v1/admin/reviews`
- `PATCH /api/v1/admin/reviews/:id/status`
- `DELETE /api/v1/admin/reviews/:id`

## API Response Convention

Successful responses are wrapped globally:

```json
{
	"success": true,
	"statusCode": 200,
	"message": "Service health retrieved successfully",
	"data": {},
	"timestamp": "2026-08-25T10:00:00.000Z",
	"path": "/api/v1/health",
	"requestId": "request-id"
}
```

Errors use a stable contract:

```json
{
	"success": false,
	"statusCode": 400,
	"errorCode": "VALIDATION_ERROR",
	"message": "Validation failed",
	"errors": [],
	"timestamp": "2026-08-25T10:00:00.000Z",
	"path": "/api/v1/example",
	"requestId": "request-id"
}
```

## Commands

```bash
npm run build
npm run lint
npm test
npm run test:e2e
npm run start
npm run start:dev
npm run start:prod
npm run migration:create
npm run migration:generate
npm run migration:run
npm run migration:revert
npm run migration:show
npm run seed
```

## Project Structure

```text
src/
|-- common/
|-- config/
|-- database/
|   |-- migrations/
|   |-- seeds/
|   |-- data-source.ts
|   `-- database.module.ts
|-- modules/
|   |-- addresses/
|   |-- auth/
|   |-- brands/
|   |-- carts/
|   |-- categories/
|   |-- checkout/
|   |-- discounts/
|   |-- health/
|   |-- idempotency/
|   |-- inventory/
|   |-- notifications/
|   |-- orders/
|   |-- payments/
|   |-- permissions/
|   |-- products/
|   |-- refunds/
|   |-- reviews/
|   |-- roles/
|   |-- shipping/
|   |-- users/
|   `-- wishlists/
|-- app.module.ts
`-- main.ts
```
