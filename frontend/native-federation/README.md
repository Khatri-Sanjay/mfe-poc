# CommerceOS — Module Federation E-Commerce Platform

A full-featured e-commerce platform built with **Angular 22** and **NestJS**, using **Module Federation** for microfrontend architecture. The shell app serves as the host application, loading remote microfrontends at runtime.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Module Federation Setup](#module-federation-setup)
- [API Reference](#api-reference)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

CommerceOS is a modular e-commerce platform where each major feature (auth, checkout, orders, admin) is an independently deployable Angular application. Module Federation enables these apps to share a single browser session while being developed and deployed independently.

**Current Microfrontends:**

| App | Role | Port | Description |
|-----|------|------|-------------|
| `shell-app` | Host | 4200 | Main storefront — products, catalog, cart, wishlist |
| `auth-app` | Remote | 4201 | Authentication — login, register, password recovery |
| `admin-app` | Remote | — | Admin dashboard (planned) |

**Backend API:** NestJS REST API at `http://localhost:3000/api/v1`

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           shell-app (Host)                              │
│                           http://localhost:4200                         │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Header: [Brand] [Shop | Wishlist | Orders | Admin] [🔍] [♡] [🛒] [👤] │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │                        <router-outlet />                          │  │
│  │                                                                    │  │
│  │  LOCAL ROUTES:                                                     │  │
│  │  /                 → HomePage                                      │  │
│  │  /products         → ProductListPage (filter sidebar + grid)       │  │
│  │  /products/:slug   → ProductDetailPage (gallery, reviews, cart)    │  │
│  │  /wishlist         → WishlistPage                                  │  │
│  │  /cart             → CartPage                                      │  │
│  │                                                                    │  │
│  │  REMOTE ROUTES (via Module Federation):                            │  │
│  │  /auth/*           → ┌────────────────────────────────────────┐   │  │
│  │                      │  auth-app (Remote)                     │   │  │
│  │                      │  http://localhost:4201                 │   │  │
│  │                      │                                        │   │  │
│  │                      │  /auth/login        → LoginPage        │   │  │
│  │                      │  /auth/register     → RegisterPage     │   │  │
│  │                      │  /auth/forgot-pw    → ForgotPassword   │   │  │
│  │                      │  /auth/reset-pw     → ResetPassword    │   │  │
│  │                      │  /auth/verify-email → VerifyEmail      │   │  │
│  │                      │  /auth/dashboard    → Dashboard        │   │  │
│  │                      └────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Footer: [Brand] [Shop Links] [Account Links] [Support Links]    │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────┐  ┌──────────────────────────────────────┐   │
│  │  Mobile Bottom Nav    │  │  Toast Notifications (z-index: 80)   │   │
│  │  [🏠 Home] [🛍 Shop]  │  │                                      │   │
│  │  [♡ Saved] [🛒 Cart]  │  │                                      │   │
│  │  [👤 Account]         │  │                                      │   │
│  └──────────────────────┘  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

                            ↕ HTTP API Calls ↕

┌─────────────────────────────────────────────────────────────────────────┐
│                     NestJS Backend API                                  │
│                     http://localhost:3000/api/v1                        │
│                                                                         │
│  Modules: Auth | Products | Categories | Brands | Cart | Wishlist      │
│           Orders | Checkout | Payments | Reviews | Users | Addresses    │
│           Shipping | Coupons | Inventory | Refunds | Notifications     │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Features

### Shell App (Host)

#### Product Catalog
- **Product Listing** — Grid view with sidebar filter panel
  - Search with 300ms debounce
  - Filter by category, brand, price range
  - Sort by newest, name, price (asc/desc)
  - In-stock toggle
  - URL query param sync for all filters
  - Pagination with prev/next controls
- **Product Detail** — Full product page with:
  - Image gallery with thumbnail strip
  - Variant selection (visual chips)
  - Quantity selector (+/− buttons)
  - Stock availability indicator
  - Discount percentage badge
  - Add to cart / Add to wishlist
  - Tabbed content (Description + Reviews)
  - Review submission with star rating
  - Breadcrumb navigation

#### Layout Components
- **Header** — Sticky glassmorphism header
  - Brand logo + name
  - Desktop navigation (Shop, Wishlist, Orders, Admin)
  - Search bar with focus state
  - Wishlist icon with badge count
  - Cart icon with badge count
  - Account dropdown menu (authenticated)
  - Sign in button (guest)
  - Mobile hamburger menu → slide-in drawer
- **Footer** — 4-column layout
  - Brand + social links (GitHub, Twitter, YouTube)
  - Shop links (All Products, New Arrivals, Price filters)
  - Account links (Sign In, Register, Orders, Wishlist)
  - Support links (Help, Shipping, Returns, Contact)
  - Copyright + legal links
- **Mobile Navigation** — Fixed bottom tab bar (5 tabs)
- **Toast Notifications** — Auto-dismissing success/error/warning/info toasts

#### State Management (Signal-Based)
- **AuthFacade** — `signal<User | null>`, `computed(isAuthenticated)`, token refresh
- **CartFacade** — `signal<Cart>`, `computed(itemCount)`, add/update/remove
- **WishlistFacade** — `signal<WishlistItem[]>`, add/remove/has
- **CatalogFacade** — `signal<Product[]>`, `signal<Category[]>`, `signal<Brand[]>`, search/pagination
- **NotificationService** — `signal<Notification[]>`, auto-dismiss

#### Design System
- CSS custom properties (`--color-primary: #12473f`, `--color-secondary: #c88a2d`)
- Inter font family with ultra-bold weights
- Responsive breakpoints: 1080px, 900px, 560px
- Glassmorphism effects (backdrop-filter blur)
- Product card hover animations (translateY, shadow)
- Skeleton loading states

---

### Auth App (Remote)

#### Authentication Pages
- **Login** — Email + password form with:
  - Password visibility toggle
  - Inline error messages
  - Loading spinner
  - Link to register/forgot password
- **Register** — Full registration form:
  - First name, last name, email, phone (optional)
  - Password with real-time strength hints
  - Confirm password validation
  - Client-side password rules (min 12 chars, uppercase, lowercase, digit)
- **Forgot Password** — Email input, generic success message
- **Reset Password** — Token-based new password form (reads `?token=` query)
- **Verify Email** — Auto-verifies on init from `?token=` query
- **Resend Verification** — Email input to request new verification link
- **Dashboard** — Post-login page with user info + logout

#### Auth Architecture
- **AuthService** — Signal-based state (`user`, `isLoading`, `error`, `isLoggedIn`)
- **Token Storage** — JWT access + refresh tokens in `localStorage`
- **HTTP Interceptor** — Attaches `Authorization: Bearer` header to all requests
- **Route Guards** — `authGuard` (protected routes), `guestGuard` (redirect if logged in)
- **API Communication** — `http://localhost:3000/api/v1/auth/*`

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Framework** | Angular | 22.1.x |
| **Language** | TypeScript | 6.0.x |
| **Styling** | Tailwind CSS | 4.1.x |
| **Icons** | Bootstrap Icons | 1.13.1 |
| **State** | Angular Signals | Built-in |
| **Forms** | Template-driven (FormsModule) | Angular built-in |
| **HTTP** | HttpClient + Interceptors | Angular built-in |
| **Testing** | Vitest | 4.0.x |
| **Microfrontend** | @angular-architects/module-federation | Latest |
| **Backend** | NestJS | 11.x |
| **Database** | PostgreSQL | Via TypeORM |
| **Auth** | JWT (Argon2id hashing) | — |
| **API Docs** | Swagger/OpenAPI | `/api/docs` |

---

## Project Structure

```
frontend/module-federation/
│
├── shell-app/                          # HOST APPLICATION
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.service.ts          # Login/register/refresh API calls
│   │   │   │   │   └── token-storage.service.ts # SessionStorage token persistence
│   │   │   │   ├── config/
│   │   │   │   │   └── api.config.ts            # InjectionToken for API base URL
│   │   │   │   ├── http/
│   │   │   │   │   ├── api-client.service.ts    # Generic HTTP wrapper (get, getPage, post, patch, delete)
│   │   │   │   │   ├── api-response.model.ts    # ApiResponse<T>, PaginatedData<T>, PaginationMeta
│   │   │   │   │   ├── api-error.ts             # ApiError class with friendly messages
│   │   │   │   │   └── auth.interceptor.ts      # Bearer token injection + 401 refresh
│   │   │   │   └── models/
│   │   │   │       └── commerce.models.ts       # All TypeScript interfaces (Product, Cart, User, etc.)
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── catalog/
│   │   │   │   │   ├── catalog.service.ts       # HTTP calls for products, categories, brands
│   │   │   │   │   ├── catalog.facade.ts        # Signal state (products, categories, brands, meta)
│   │   │   │   │   ├── product-list.page.ts     # Product grid + filter sidebar
│   │   │   │   │   └── product-detail.page.ts   # Product detail with gallery, reviews
│   │   │   │   ├── home/
│   │   │   │   │   └── home.page.ts             # Hero banner + featured products
│   │   │   │   ├── cart/
│   │   │   │   │   ├── cart.service.ts          # HTTP calls for cart operations
│   │   │   │   │   ├── cart.facade.ts           # Signal state (cart, itemCount)
│   │   │   │   │   └── cart.page.ts             # Cart page with line items
│   │   │   │   └── wishlist/
│   │   │   │       ├── wishlist.service.ts      # HTTP calls for wishlist
│   │   │   │       ├── wishlist.facade.ts       # Signal state (items, has)
│   │   │   │       └── wishlist.page.ts         # Wishlist page
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── header/
│   │   │   │   │   └── header.component.ts      # Sticky header with search, nav, account menu
│   │   │   │   ├── footer/
│   │   │   │   │   └── footer.component.ts      # 4-column footer with links
│   │   │   │   ├── shell/
│   │   │   │   │   └── shell.component.ts       # Layout wrapper (header + router-outlet + footer)
│   │   │   │   └── mobile-navigation/
│   │   │   │       └── mobile-navigation.component.ts  # Bottom tab bar
│   │   │   │
│   │   │   ├── shared/
│   │   │   │   ├── pipes/
│   │   │   │   │   └── money.pipe.ts            # AUD currency formatting
│   │   │   │   └── components/
│   │   │   │       ├── empty-state/
│   │   │   │       │   └── empty-state.component.ts  # Dashed border placeholder
│   │   │   │       └── toast/
│   │   │   │           └── toast.component.ts   # Notification stack
│   │   │   │
│   │   │   ├── state/
│   │   │   │   ├── auth/
│   │   │   │   │   └── auth.facade.ts           # Signal-based auth state
│   │   │   │   ├── cart/
│   │   │   │   │   └── cart.facade.ts           # Signal-based cart state
│   │   │   │   └── ui/
│   │   │   │       └── notification.service.ts  # Toast notification service
│   │   │   │
│   │   │   ├── app.ts                           # Root component (<router-outlet />)
│   │   │   ├── app.html
│   │   │   ├── app.routes.ts                    # All routes (local + remote)
│   │   │   └── app.config.ts                    # Providers (router, httpClient, MF)
│   │   │
│   │   ├── environments/
│   │   │   ├── environment.ts                   # API base URL (dev)
│   │   │   ├── environment.development.ts
│   │   │   └── environment.production.ts
│   │   ├── styles.css                           # Global design system (1500+ lines)
│   │   ├── index.html
│   │   └── main.ts                              # Bootstrap entry
│   │
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js                        # MF host configuration
│
│
├── auth-app/                            # REMOTE APPLICATION
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/
│   │   │   │   ├── models/
│   │   │   │   │   └── auth.model.ts            # Auth-specific interfaces
│   │   │   │   ├── services/
│   │   │   │   │   └── auth.ts                  # AuthService (signal-based)
│   │   │   │   ├── guards/
│   │   │   │   │   └── auth.guard.ts            # authGuard + guestGuard
│   │   │   │   └── interceptors/
│   │   │   │       └── auth.interceptor.ts      # Bearer token interceptor
│   │   │   │
│   │   │   ├── features/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth-layout/             # Centered card wrapper
│   │   │   │   │   ├── login/                   # Login form
│   │   │   │   │   ├── register/                # Registration form
│   │   │   │   │   ├── forgot-password/         # Password reset request
│   │   │   │   │   ├── reset-password/          # New password form
│   │   │   │   │   ├── verify-email/            # Email verification
│   │   │   │   │   └── resend-verification/     # Resend verification
│   │   │   │   └── dashboard/
│   │   │   │       └── dashboard.ts             # Post-login dashboard
│   │   │   │
│   │   │   ├── app.ts                           # Root component
│   │   │   ├── app.routes.ts                    # Routes (exposed via MF)
│   │   │   └── app.config.ts                    # Providers
│   │   │
│   │   ├── environments/
│   │   │   └── environment.ts                   # API base URL
│   │   ├── styles.css                           # Auth-specific styles
│   │   ├── index.html
│   │   └── main.ts                              # Bootstrap entry
│   │
│   ├── angular.json
│   ├── package.json
│   ├── tsconfig.json
│   └── webpack.config.js                        # MF remote configuration
│
│
├── admin-app/                          # REMOTE APPLICATION (planned)
│   └── ...
│
└── README.md                           # This file
```

---

## Getting Started

### Prerequisites

- **Node.js** 18+ (recommended: 20+)
- **npm** 9+
- **PostgreSQL** running on default port
- **Backend API** running at `http://localhost:3000`

### 1. Clone & Install

```bash
# Clone the repository
git clone <repository-url>
cd mfepoc-ecom

# Install backend dependencies
cd backend/ecommerce-api
npm install

# Install auth-app dependencies
cd ../../frontend/module-federation/auth-app
npm install

# Install shell-app dependencies
cd ../shell-app
npm install
```

### 2. Setup Database

```bash
cd backend/ecommerce-api

# Copy environment file
cp .env.example .env

# Edit .env with your PostgreSQL credentials
# Run migrations
npm run migration:run

# Seed initial data (optional)
npm run seed
```

### 3. Start Development Servers

**Order matters:** Start the remote app first, then the host.

```bash
# Terminal 1: Backend API
cd backend/ecommerce-api
npm run start:dev
# → http://localhost:3000
# → Swagger docs: http://localhost:3000/api/docs

# Terminal 2: Auth App (Remote) — MUST start first
cd frontend/module-federation/auth-app
npm start
# → http://localhost:4201
# → Remote entry: http://localhost:4201/remoteEntry.js

# Terminal 3: Shell App (Host)
cd frontend/module-federation/shell-app
npm start
# → http://localhost:4200
```

### 4. Verify

1. Open http://localhost:4200
2. Browse products on the home page
3. Click "Sign in" → loads login form from auth-app via Module Federation
4. Register a new account or use existing credentials
5. After login, header shows user name + logout button
6. Add products to cart, view wishlist

---

## Module Federation Setup

### What is Module Federation?

Module Federation (MF) allows multiple independently built and deployed Angular applications to share code at runtime. Instead of building a single monolithic app, each feature can be its own application that loads on demand.

**Key Benefits:**
- **Independent deployment** — Deploy auth changes without rebuilding the entire app
- **Team autonomy** — Different teams own different microfrontends
- **Code sharing** — Shared dependencies (Angular, RxJS) are loaded once
- **Runtime integration** — No build-time coupling between apps

### How It Works

```
1. User visits http://localhost:4200 (shell-app)
2. Shell-app loads its own code + shared Angular dependencies
3. User clicks "Sign in" → Angular router navigates to /auth/login
4. Route config triggers: loadRemoteModule('auth', './routes')
5. Module Federation fetches remoteEntry.js from auth-app (port 4201)
6. Auth-app's routes, components, and styles are loaded into the shell-app
7. Login form renders inside the shell-app's layout (header + footer)
8. User logs in → tokens stored in localStorage
9. Shell-app reads tokens → updates header to show authenticated state
```

### Configuration Files

#### auth-app/webpack.config.js (Remote)

```javascript
const { shareAll, withModuleFederationPlugin } = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  name: "auth",                          // Remote name
  exposes: {
    "./routes": "./src/app/app.routes.ts", // Expose routes for lazy loading
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
});
```

#### shell-app/webpack.config.js (Host)

```javascript
const { shareAll, withModuleFederationPlugin } = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  remotes: {
    auth: "http://localhost:4201/remoteEntry.js",  // Remote entry URL
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
});
```

#### shell-app/app.routes.ts (Remote Route Loading)

```typescript
import { loadRemoteModule } from "@angular-architects/module-federation";

// Remote auth routes — loaded on demand from auth-app
{
  path: "auth",
  loadChildren: () =>
    loadRemoteModule("auth", "./routes").then((m) => m.routes),
}
```

### Shared Dependencies

Both apps share Angular packages as singletons to avoid duplicate instances:

| Package | Purpose | Why Singleton |
|---------|---------|---------------|
| `@angular/core` | Angular core | Must have single instance |
| `@angular/common` | Common module | Shared utilities |
| `@angular/router` | Routing | Single router state |
| `@angular/forms` | Forms | Shared form state |
| `@angular/platform-browser` | Platform | Single bootstrap |
| `rxjs` | Reactive | Single Observable implementation |

The `shareAll()` helper automatically handles this.

---

## API Reference

The backend API runs at `http://localhost:3000/api/v1`. Swagger documentation is available at `http://localhost:3000/api/docs`.

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/health` | Health check |
| `GET` | `/api/v1/products` | List products (paginated, filterable) |
| `GET` | `/api/v1/products/:id` | Get product by ID |
| `GET` | `/api/v1/products/slug/:slug` | Get product by slug |
| `GET` | `/api/v1/categories` | List categories |
| `GET` | `/api/v1/brands` | List brands |
| `GET` | `/api/v1/products/:id/reviews` | List product reviews |
| `GET` | `/api/v1/shipping/methods` | List shipping methods |

### Authentication Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/v1/auth/register` | No | Register new account |
| `POST` | `/api/v1/auth/login` | No | Login (returns JWT tokens) |
| `POST` | `/api/v1/auth/refresh` | No | Refresh access token |
| `POST` | `/api/v1/auth/logout` | No | Revoke refresh token |
| `POST` | `/api/v1/auth/forgot-password` | No | Request password reset |
| `POST` | `/api/v1/auth/reset-password` | No | Reset password with token |
| `POST` | `/api/v1/auth/verify-email` | No | Verify email with token |
| `GET` | `/api/v1/auth/me` | Bearer | Get current user |

### Authenticated Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/me` | Get user profile |
| `PATCH` | `/api/v1/users/me` | Update profile |
| `GET` | `/api/v1/users/me/addresses` | List addresses |
| `POST` | `/api/v1/users/me/addresses` | Create address |
| `GET` | `/api/v1/cart` | Get cart |
| `POST` | `/api/v1/cart/items` | Add to cart |
| `PATCH` | `/api/v1/cart/items/:id` | Update cart item |
| `DELETE` | `/api/v1/cart/items/:id` | Remove from cart |
| `GET` | `/api/v1/wishlist` | Get wishlist |
| `POST` | `/api/v1/wishlist/items` | Add to wishlist |
| `DELETE` | `/api/v1/wishlist/items/:id` | Remove from wishlist |
| `GET` | `/api/v1/orders` | List orders |
| `POST` | `/api/v1/checkout` | Checkout cart |
| `POST` | `/api/v1/products/:id/reviews` | Create review |

### Query Parameters (Products)

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page (max 100) |
| `search` | string | — | Search by name/SKU/brand |
| `category` | string | — | Filter by category slug |
| `brand` | string | — | Filter by brand slug |
| `minPrice` | number | — | Minimum price |
| `maxPrice` | number | — | Maximum price |
| `inStock` | boolean | — | Filter by stock availability |
| `sortBy` | string | `createdAt` | Sort field (createdAt/name/price) |
| `sortOrder` | string | `desc` | Sort direction (asc/desc) |

### Response Envelope

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Products retrieved successfully",
  "data": [...],
  "meta": {
    "page": 1,
    "limit": 12,
    "total": 150,
    "totalPages": 13
  },
  "timestamp": "2026-08-26T10:00:00.000Z",
  "path": "/api/v1/products",
  "requestId": "uuid"
}
```

---

## Development

### Code Style

- **Prettier** configured with Angular HTML parser
- **EditorConfig** for consistent formatting (2-space indent, UTF-8)
- **No comments** unless explicitly requested
- **Standalone components** throughout (no NgModules)
- **Signal-based state** (no NgRx/Akita)
- **Inline templates** for small components, external files for large ones

### Testing

```bash
# Shell-app tests (Vitest)
cd shell-app
npm test

# Auth-app tests (Vitest)
cd auth-app
npm test
```

### Build

```bash
# Production build
cd shell-app
npm run build
# Output: dist/shell-app/browser/

# Auth-app production build
cd auth-app
npm run build
# Output: dist/auth-app/browser/
```

### Environment Configuration

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Development API URL |
| `src/environments/environment.development.ts` | Development overrides |
| `src/environments/environment.production.ts` | Production API URL |

---

## Production Deployment

### Remote Entry URL

In production, each remote app is deployed independently. Update the shell-app's webpack config:

```javascript
// shell-app/webpack.config.js
const authRemoteUrl = process.env.AUTH_REMOTE_URL || "http://localhost:4201";

module.exports = withModuleFederationPlugin({
  remotes: {
    auth: `${authRemoteUrl}/remoteEntry.js`,
  },
  // ...
});
```

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CDN / Load Balancer                   │
└─────────────────────────────────────────────────────────┘
          │                    │                    │
          ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   shell-app     │  │   auth-app      │  │   admin-app     │
│   (Host)        │  │   (Remote)      │  │   (Remote)      │
│                 │  │                 │  │                 │
│  shell.domain   │  │  auth.domain    │  │  admin.domain   │
└─────────────────┘  └─────────────────┘  └─────────────────┘
          │                    │                    │
          └────────────────────┼────────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Backend API       │
                    │   api.domain        │
                    └─────────────────────┘
```

### CORS Configuration

Ensure the backend API allows requests from all frontend domains:

```typescript
// NestJS main.ts
app.enableCors({
  origin: [
    'http://localhost:4200',
    'http://localhost:4201',
    'https://shell.yourdomain.com',
    'https://auth.yourdomain.com',
  ],
  credentials: true,
});
```

---

## Troubleshooting

### 1. "Remote entry failed to load"

**Cause:** Auth-app not running or CORS issue.

```bash
# Check if auth-app is running
curl http://localhost:4201/remoteEntry.js

# If not running, start it first
cd auth-app && npm start
```

### 2. "Cannot read properties of undefined"

**Cause:** Version mismatch between apps.

```bash
# Check Angular versions match
cd shell-app && npm ls @angular/core
cd auth-app && npm ls @angular/core
```

### 3. Duplicate Angular instances

**Cause:** Shared dependencies not configured as singletons.

**Fix:** Both `webpack.config.js` files must use `shareAll({ singleton: true })`.

### 4. Route not found for /auth/login

**Cause:** Remote routes not loaded.

**Fix:** Verify `loadRemoteModule` call and remote name matches:

```typescript
// shell-app/app.routes.ts
loadRemoteModule("auth", "./routes")  // "auth" must match webpack name

// auth-app/webpack.config.js
name: "auth"  // Must match the remote name used in shell-app
```

### 5. HMR not working for remote changes

**Expected:** Module Federation has limited HMR support. After changes to the remote app:
1. Restart the remote app's dev server
2. Hard refresh the host app's browser (Ctrl+Shift+R)

### 6. Styles not applied for remote components

**Cause:** Remote app's styles not loaded.

**Fix:** Ensure remote app's global styles are included or use `styleUrls` in components.

---

## Roadmap

- [ ] **Checkout App** — Separate microfrontend for checkout flow
- [ ] **Orders App** — Order history and tracking
- [ ] **Admin App** — Product, order, inventory management
- [ ] **Shared Theme** — CSS custom properties for consistent styling across apps
- [ ] **Event Bus** — Cross-app communication for real-time updates
- [ ] **CI/CD Pipeline** — Automated deployment for each microfrontend
- [ ] **E2E Tests** — Cypress/Playwright tests covering cross-app flows
- [ ] **Performance Monitoring** — Module Federation observability

---

## Resources

- [Angular-Architects Module Federation](https://angular-architects.io/learn/module-federation/)
- [Module Federation GitHub](https://github.com/module-federation/module-federation)
- [Angular Signals](https://angular.dev/guide/signals)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

---

## License

MIT
