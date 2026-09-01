# EcommerceWeb

Angular storefront for the NestJS e-commerce API in `E:\Projects\mfepoc-ecom\backend\ecommerce-api`.

## Architecture

The app is structured as a single deployable Angular shell with lazy feature boundaries that can later be extracted into MFEs without introducing Module Federation yet:

- `app/core`: API config, HTTP client, auth service, interceptor, guards, shared domain contracts
- `app/shared`: reusable UI primitives, pipes, notifications, confirmation dialog
- `app/layout`: shell, header, footer, mobile navigation
- `app/features`: auth, catalog, cart, checkout, account, orders, wishlist, admin
- `app/state`: auth, cart, and UI facades

Feature components talk to facades/services rather than making direct backend calls. The backend remains the security boundary; frontend roles and permissions only control navigation and visible actions.

## API and Authentication

The API URL comes from Angular environment configuration:

- Development: `http://localhost:3000/api/v1`
- Production: `/api/v1`

The HTTP layer unwraps the backend response envelope centrally. Authenticated requests use a functional interceptor. On `401`, the interceptor performs refresh-token rotation, prevents simultaneous refresh requests, retries the original request once, and clears auth state on refresh failure.

Tokens are stored in `sessionStorage`. This is a practical choice for the current backend contract because the API returns bearer tokens directly and does not issue secure HttpOnly cookies. `sessionStorage` avoids longer-lived persistence across browser restarts; a cookie-based backend contract would be preferable for higher-security production deployments.

## Implemented app features

- API-backed catalog with search, category, brand, price, stock, and sorting filters
- Product detail, variants, ratings, approved reviews, and review submission
- Login, registration, token persistence, refresh, and logout
- Cart add/update/remove/clear plus coupon support
- Address book, profile editing, password change, wishlist, shipping methods
- Checkout quote and mock-paid order placement with idempotency key
- Customer order history and cancellation
- Admin dashboard, permission-aware admin navigation, routed admin resource screens, CRUD/status/refund actions, and API console presets for users, products, categories, brands, inventory, orders, refunds, coupons, shipping, and reviews

## Backend gaps documented

The admin dashboard does not invent metrics. Revenue and pending-refund KPIs are marked as unavailable because the backend does not currently expose a dashboard summary endpoint such as `GET /api/v1/admin/dashboard/summary`.

## Run with backend

Start the backend first:

```bash
cd E:\Projects\mfepoc-ecom\backend\ecommerce-api
docker compose up -d postgres
npm run migration:run
npm run seed
npm run start:dev
```

Then start this frontend:

```bash
cd E:\Projects\mfepoc-ecom\frontend\module-federation\ecommerce-web
npm install
npm start
```

Open `http://localhost:4200/`.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 22.1.5.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
