# Shell App — Module Federation Host

This is the **main storefront** for CommerceOS. It serves as the **Module Federation host** that loads remote microfrontends (auth-app, admin-app, etc.) at runtime.

**Port:** `4200`
**Backend API:** `http://localhost:3000/api/v1`

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Current State](#current-state)
- [Module Federation Setup](#module-federation-setup)
- [File Changes Required](#file-changes-required)
- [Running the App](#running-the-app)
- [Adding More Remotes](#adding-more-remotes)
- [Testing Module Federation](#testing-module-federation)
- [Available Routes](#available-routes)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Overview

This app is the **host** in the Module Federation architecture. It:

1. Runs its own pages (home, products, cart, wishlist)
2. Loads remote apps (auth-app) when users navigate to their routes
3. Provides the shared layout (header, footer, mobile nav)
4. Manages shared state (auth, cart, wishlist) via signals

### What It Loads Remotely

| Remote | Name | Port | Routes Loaded |
|--------|------|------|---------------|
| auth-app | `auth` | 4201 | `/auth/*` |
| admin-app | `admin` | — | `/admin/*` (planned) |

---

## Features

### Product Catalog
- Product listing with grid layout + sidebar filters
- Search with 300ms debounce
- Filter by category, brand, price range, stock availability
- Sort by newest, name, price (asc/desc)
- URL query param sync for all filters
- Pagination with prev/next controls
- Product detail page with image gallery, variant selection, quantity stepper
- Review submission with star rating
- Breadcrumb navigation

### Cart & Wishlist
- Add to cart / Add to wishlist
- Cart page with line items
- Wishlist page with saved products
- Badge counts on header icons

### Layout
- Sticky glassmorphism header with search, navigation, account menu
- 4-column footer with links and social icons
- Mobile bottom tab navigation (5 tabs)
- Mobile hamburger menu with slide-in drawer
- Toast notification stack

### State Management
- **AuthFacade** — `signal<User | null>`, `computed(isAuthenticated)`, token refresh
- **CartFacade** — `signal<Cart>`, `computed(itemCount)`, add/update/remove
- **WishlistFacade** — `signal<WishlistItem[]>`, add/remove/has
- **CatalogFacade** — `signal<Product[]>`, `signal<Category[]>`, `signal<Brand[]>`, search/pagination
- **NotificationService** — `signal<Notification[]>`, auto-dismiss

---

## Current State

The app currently uses the **default Angular CLI builder** (`@angular/build:application`). Module Federation is **not yet configured**. The sections below describe the exact changes needed.

### Current Files

| File | Current State |
|------|---------------|
| `angular.json` | Uses `@angular/build:application` builder |
| `src/main.ts` | Standard bootstrap — no MF |
| `src/app/app.config.ts` | No `provideModuleFederation()` |
| `src/app/app.routes.ts` | Local routes only — no remote loading |
| `package.json` | No `@angular-architects/module-federation` |
| `webpack.config.js` | Does not exist |

---

## Module Federation Setup

### Step 1: Install Module Federation Package

```bash
cd shell-app
npm add @angular-architects/module-federation
```

### Step 2: Update `angular.json`

Replace the `architect` section in `angular.json`. Change the builder from `@angular/build:application` to `@angular-architects/module-federation` for both `build` and `serve`.

**Current** (`angular.json` lines 15–69):
```json
"build": {
  "builder": "@angular/build:application",
  "options": {
    "browser": "src/main.ts",
    "tsConfig": "tsconfig.app.json",
    "assets": [
      { "glob": "**/*", "input": "public" }
    ],
    "styles": [
      "src/styles.css"
    ]
  },
  "configurations": { ... },
  "defaultConfiguration": "production"
},
"serve": {
  "builder": "@angular/build:dev-server",
  "configurations": { ... },
  "defaultConfiguration": "development"
}
```

**Replace with:**
```json
"build": {
  "builder": "@angular-architects/module-federation",
  "options": {
    "extraWebpackConfig": "webpack.config.js",
    "browser": "src/main.ts",
    "tsConfig": "tsconfig.app.json",
    "assets": [
      { "glob": "**/*", "input": "public" }
    ],
    "styles": [
      "src/styles.css"
    ]
  },
  "configurations": {
    "production": {
      "budgets": [
        {
          "type": "initial",
          "maximumWarning": "500kB",
          "maximumError": "1MB"
        },
        {
          "type": "anyComponentStyle",
          "maximumWarning": "4kB",
          "maximumError": "8kB"
        }
      ],
      "outputHashing": "all"
    },
    "development": {
      "optimization": false,
      "extractLicenses": false,
      "sourceMap": true
    }
  },
  "defaultConfiguration": "production"
},
"serve": {
  "builder": "@angular-architects/module-federation",
  "options": {
    "port": 4200,
    "publicHost": "http://localhost:4200"
  },
  "configurations": {
    "production": {
      "buildTarget": "shell-app:build:production"
    },
    "development": {
      "buildTarget": "shell-app:build:development"
    }
  },
  "defaultConfiguration": "development"
}
```

### Step 3: Create `webpack.config.js`

Create a new file at `shell-app/webpack.config.js`:

```javascript
const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  // Remote apps to consume
  remotes: {
    // In development, remote entry is served directly from auth-app
    auth: "http://localhost:4201/remoteEntry.js",
  },

  // Share dependencies (must match auth-app config)
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

**What this does:**
- `remotes: { auth: "..." }` — Tells the shell-app where to find the auth-app's remote entry
- `shareAll(...)` — Automatically shares all dependencies as singletons (matches auth-app config)

### Step 4: Update `src/main.ts`

**Current** (`src/main.ts`):
```typescript
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
```

**Replace with:**
```typescript
import { loadManifest } from "@angular-architects/module-federation";
import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";

bootstrapApplication(App, appConfig).catch((err) =>
  console.error(err)
);
```

### Step 5: Update `src/app/app.config.ts`

**Current** (`src/app/app.config.ts`):
```typescript
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { authInterceptor } from './core/http/auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
};
```

**Replace with:**
```typescript
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideModuleFederation } from "@angular-architects/module-federation";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/http/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideModuleFederation(),
  ],
};
```

### Step 6: Update `src/app/app.routes.ts`

Add the remote auth routes using `loadRemoteModule`.

**Current** (`src/app/app.routes.ts`):
```typescript
import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage) },
      { path: 'products', loadComponent: () => import('./features/catalog/product-list.page').then((m) => m.ProductListPage) },
      { path: 'products/:slug', loadComponent: () => import('./features/catalog/product-detail.page').then((m) => m.ProductDetailPage) },
      { path: 'categories/:slug', loadComponent: () => import('./features/catalog/product-list.page').then((m) => m.ProductListPage) },
      { path: 'brands/:slug', loadComponent: () => import('./features/catalog/product-list.page').then((m) => m.ProductListPage) },
      { path: 'wishlist', loadComponent: () => import('./features/wishlist/wishlist.page').then((m) => m.WishlistPage) },
      { path: 'cart', loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage) },
    ],
  },
];
```

**Replace with:**
```typescript
import { Routes } from "@angular/router";
import { loadRemoteModule } from "@angular-architects/module-federation";
import { ShellComponent } from "./layout/shell/shell.component";

export const routes: Routes = [
  {
    path: "",
    component: ShellComponent,
    children: [
      // Local routes
      {
        path: "",
        loadComponent: () =>
          import("./features/home/home.page").then((m) => m.HomePage),
      },
      {
        path: "products",
        loadComponent: () =>
          import("./features/catalog/product-list.page").then(
            (m) => m.ProductListPage
          ),
      },
      {
        path: "products/:slug",
        loadComponent: () =>
          import("./features/catalog/product-detail.page").then(
            (m) => m.ProductDetailPage
          ),
      },
      {
        path: "categories/:slug",
        loadComponent: () =>
          import("./features/catalog/product-list.page").then(
            (m) => m.ProductListPage
          ),
      },
      {
        path: "brands/:slug",
        loadComponent: () =>
          import("./features/catalog/product-list.page").then(
            (m) => m.ProductListPage
          ),
      },
      {
        path: "wishlist",
        loadComponent: () =>
          import("./features/wishlist/wishlist.page").then(
            (m) => m.WishlistPage
          ),
      },
      {
        path: "cart",
        loadComponent: () =>
          import("./features/cart/cart.page").then((m) => m.CartPage),
      },

      // Remote auth routes — loaded from auth-app via Module Federation
      {
        path: "auth",
        loadChildren: () =>
          loadRemoteModule("auth", "./routes").then((m) => m.routes),
      },
    ],
  },
];
```

**Key change:** The new `auth` route uses `loadRemoteModule("auth", "./routes")` which:
1. Fetches `http://localhost:4201/remoteEntry.js` from the auth-app
2. Loads the auth-app's `routes` export
3. Mounts all auth routes under `/auth/*`

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Edit | Add `@angular-architects/module-federation` |
| `angular.json` | Edit | Switch builders to `@angular-architects/module-federation` |
| `webpack.config.js` | **Create** | MF host configuration with `remotes` pointing to auth-app |
| `src/main.ts` | Edit | Import `loadManifest` for MF compatibility |
| `src/app/app.config.ts` | Edit | Add `provideModuleFederation()` provider |
| `src/app/app.routes.ts` | Edit | Add `loadRemoteModule("auth", "./routes")` for `/auth` path |

---

## Running the App

### Start Order

**Important:** Always start the remote app (auth-app) FIRST, then the host (shell-app).

```bash
# Terminal 1: Backend API
cd backend/ecommerce-api
npm run start:dev
# → http://localhost:3000

# Terminal 2: Auth App (REMOTE) — MUST start first
cd auth-app
npm start
# → http://localhost:4201
# → Remote entry: http://localhost:4201/remoteEntry.js

# Terminal 3: Shell App (HOST)
cd shell-app
npm start
# → http://localhost:4200
```

### Why Start Remote First?

Module Federation fetches the remote entry file when the host app loads. If the remote isn't running, the host will fail to fetch the remote entry and show an error.

### Verify Setup

1. Open http://localhost:4200
2. Browse products on the home page
3. Click "Sign in" in the header
4. URL changes to `http://localhost:4200/auth/login`
5. Login form renders inside the shell-app's layout (header + footer visible)
6. The login form code was loaded from auth-app (port 4201) at runtime

---

## Adding More Remotes

To add a new remote app (e.g., `admin-app`):

### 1. Create the Remote App

Follow the same pattern as auth-app with its own `webpack.config.js`:

```javascript
// admin-app/webpack.config.js
const { shareAll, withModuleFederationPlugin } = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  name: "admin",
  exposes: {
    "./routes": "./src/app/app.routes.ts",
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
});
```

### 2. Register in Shell App

Update `shell-app/webpack.config.js`:

```javascript
module.exports = withModuleFederationPlugin({
  remotes: {
    auth: "http://localhost:4201/remoteEntry.js",
    admin: "http://localhost:4202/remoteEntry.js",  // Add new remote
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
});
```

### 3. Add Route in Shell App

Update `shell-app/src/app/app.routes.ts`:

```typescript
// Add new remote route
{
  path: "admin",
  loadChildren: () =>
    loadRemoteModule("admin", "./routes").then((m) => m.routes),
},
```

### 4. Start the New Remote

```bash
# Start admin-app
cd admin-app
npm start
# → http://localhost:4202
```

---

## Testing Module Federation

### Scenario 1: Auth Login

1. Start both apps (auth-app first)
2. Open http://localhost:4200
3. Click "Sign in" in the header
4. Verify: URL is `http://localhost:4200/auth/login`
5. Verify: Login form renders inside shell-app layout
6. Verify: Enter credentials and submit → JWT tokens stored
7. Verify: Header updates to show user name + logout button

### Scenario 2: Auth Register

1. Navigate to http://localhost:4200/auth/register
2. Verify: Registration form renders inside shell-app layout
3. Verify: Form validation works (required fields, password strength)
4. Verify: Submit → account created → redirect to login

### Scenario 3: Route Guards

1. When logged in, navigate to http://localhost:4200/auth/login
2. Verify: `guestGuard` redirects to `/auth/dashboard`
3. When logged out, navigate to http://localhost:4200/auth/dashboard
4. Verify: `authGuard` redirects to `/auth/login`

### Scenario 4: Remote Loading Failure

1. Stop the auth-app
2. Refresh the shell-app
3. Navigate to http://localhost:4200/auth/login
4. Verify: Error handling (MF will fail to fetch remote entry)

### What Happens at Runtime

```
1. User visits http://localhost:4200 (shell-app)
2. Shell-app loads its own code + shared Angular dependencies
3. User clicks "Sign in" → Angular router navigates to /auth/login
4. Route config triggers: loadRemoteModule('auth', './routes')
5. Module Federation fetches remoteEntry.js from auth-app (port 4201)
6. Auth-app's routes, components, and styles are loaded into the shell-app
7. Login form renders inside the shell-app's ShellComponent layout
8. User logs in → tokens stored in localStorage
9. Shell-app's AuthFacade reads tokens → updates header to show authenticated state
```

---

## Available Routes

### Local Routes (Shell App)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `HomePage` | Landing page with hero + featured products |
| `/products` | `ProductListPage` | Product grid with filters |
| `/products/:slug` | `ProductDetailPage` | Product detail with reviews |
| `/categories/:slug` | `ProductListPage` | Products filtered by category |
| `/brands/:slug` | `ProductListPage` | Products filtered by brand |
| `/wishlist` | `WishlistPage` | Saved products |
| `/cart` | `CartPage` | Shopping cart |

### Remote Routes (Loaded from auth-app)

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/auth` | — | `guestGuard` | Redirects to `/auth/login` |
| `/auth/login` | `Login` | `guestGuard` | User sign in |
| `/auth/register` | `Register` | `guestGuard` | Create account |
| `/auth/forgot-password` | `ForgotPassword` | `guestGuard` | Request password reset |
| `/auth/reset-password` | `ResetPassword` | `guestGuard` | Set new password |
| `/auth/verify-email` | `VerifyEmail` | `guestGuard` | Email verification |
| `/auth/resend-verification` | `ResendVerification` | `guestGuard` | Resend verification link |
| `/auth/dashboard` | `Dashboard` | `authGuard` | Post-login dashboard |

---

## Project Structure

```
shell-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── auth/
│   │   │   │   ├── auth.service.ts          # Login/register/refresh API calls
│   │   │   │   └── token-storage.service.ts # SessionStorage token persistence
│   │   │   ├── config/
│   │   │   │   └── api.config.ts            # InjectionToken for API base URL
│   │   │   ├── http/
│   │   │   │   ├── api-client.service.ts    # Generic HTTP wrapper
│   │   │   │   ├── api-response.model.ts    # ApiResponse<T>, PaginatedData<T>
│   │   │   │   ├── api-error.ts             # ApiError class
│   │   │   │   └── auth.interceptor.ts      # Bearer token injection + 401 refresh
│   │   │   └── models/
│   │   │       └── commerce.models.ts       # All TypeScript interfaces
│   │   │
│   │   ├── features/
│   │   │   ├── catalog/
│   │   │   │   ├── catalog.service.ts       # HTTP calls for products, categories, brands
│   │   │   │   ├── catalog.facade.ts        # Signal state (products, categories, brands, meta)
│   │   │   │   ├── product-list.page.ts     # Product grid + filter sidebar
│   │   │   │   └── product-detail.page.ts   # Product detail with gallery, reviews
│   │   │   ├── home/
│   │   │   │   └── home.page.ts             # Hero banner + featured products
│   │   │   ├── cart/
│   │   │   │   ├── cart.service.ts          # HTTP calls for cart operations
│   │   │   │   ├── cart.facade.ts           # Signal state (cart, itemCount)
│   │   │   │   └── cart.page.ts             # Cart page with line items
│   │   │   └── wishlist/
│   │   │       ├── wishlist.service.ts      # HTTP calls for wishlist
│   │   │       ├── wishlist.facade.ts       # Signal state (items, has)
│   │   │       └── wishlist.page.ts         # Wishlist page
│   │   │
│   │   ├── layout/
│   │   │   ├── header/
│   │   │   │   └── header.component.ts      # Sticky header with search, nav, account menu
│   │   │   ├── footer/
│   │   │   │   └── footer.component.ts      # 4-column footer with links
│   │   │   ├── shell/
│   │   │   │   └── shell.component.ts       # Layout wrapper (header + router-outlet + footer)
│   │   │   └── mobile-navigation/
│   │   │       └── mobile-navigation.component.ts  # Bottom tab bar
│   │   │
│   │   ├── shared/
│   │   │   ├── pipes/
│   │   │   │   └── money.pipe.ts            # AUD currency formatting
│   │   │   └── components/
│   │   │       ├── empty-state/
│   │   │       │   └── empty-state.component.ts  # Dashed border placeholder
│   │   │       └── toast/
│   │   │           └── toast.component.ts   # Notification stack
│   │   │
│   │   ├── state/
│   │   │   ├── auth/
│   │   │   │   └── auth.facade.ts           # Signal-based auth state
│   │   │   ├── cart/
│   │   │   │   └── cart.facade.ts           # Signal-based cart state
│   │   │   └── ui/
│   │   │       └── notification.service.ts  # Toast notification service
│   │   │
│   │   ├── app.ts                           # Root component (<router-outlet />)
│   │   ├── app.html
│   │   ├── app.routes.ts                    # All routes (local + remote)
│   │   └── app.config.ts                    # Providers (with MF)
│   │
│   ├── environments/
│   │   ├── environment.ts                   # API base URL (dev)
│   │   ├── environment.development.ts
│   │   └── environment.production.ts
│   ├── styles.css                           # Global design system (1500+ lines)
│   ├── index.html
│   └── main.ts                              # Bootstrap (with MF)
│
├── angular.json                             # MF builder config
├── package.json                             # @angular-architects/module-federation
├── tsconfig.json
├── tsconfig.app.json
└── webpack.config.js                        # MF host configuration (CREATE THIS)
```

---

## Shared Dependencies

The `shareAll()` helper in `webpack.config.js` automatically shares these packages as singletons:

| Package | Purpose |
|---------|---------|
| `@angular/core` | Must have single Angular instance |
| `@angular/common` | Angular common utilities |
| `@angular/router` | Single router state |
| `@angular/forms` | Shared form module |
| `@angular/platform-browser` | Single platform bootstrap |
| `rxjs` | Single Observable implementation |

This means when the shell-app loads the auth-app's remote, both apps use the same Angular instance — no duplicate code or conflicts.

---

## Troubleshooting

### 1. "Remote entry failed to load"

**Cause:** Auth-app not running or wrong port.

```bash
# Verify auth-app is running
curl http://localhost:4201/remoteEntry.js

# If not running, start it first
cd auth-app && npm start
```

### 2. CORS errors in browser console

**Cause:** Shell-app (port 4200) trying to fetch from auth-app (port 4201).

**Fix:** Add CORS headers to auth-app's `webpack.config.js`:

```javascript
// auth-app/webpack.config.js
module.exports = withModuleFederationPlugin({
  name: "auth",
  exposes: { "./routes": "./src/app/app.routes.ts" },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }) },
  devServer: {
    headers: { "Access-Control-Allow-Origin": "*" },
  },
});
```

### 3. "Cannot find module" errors

**Cause:** Version mismatch between shell-app and auth-app.

```bash
# Check Angular versions match
cd shell-app && npm ls @angular/core
cd auth-app && npm ls @angular/core
# Both should show the same version
```

### 4. Duplicate Angular instances

**Cause:** `shareAll()` not configured or `singleton: false`.

**Fix:** Ensure both `webpack.config.js` files have:
```javascript
shared: {
  ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
}
```

### 5. Route not found at /auth/login

**Cause:** Remote name mismatch or routes not exported.

**Fix:**
1. Check `shell-app/webpack.config.js` has `auth: "http://localhost:4201/remoteEntry.js"`
2. Check `auth-app/webpack.config.js` has `name: "auth"`
3. Check `loadRemoteModule("auth", "./routes")` in shell-app's routes
4. Check `auth-app/src/app/app.routes.ts` exports `routes` (not default export)

### 6. HMR not working for remote changes

**Expected:** Module Federation has limited HMR support. After changes to the remote app:
1. Restart the auth-app's dev server
2. Hard refresh the shell-app (Ctrl+Shift+R)

### 7. Styles not applied for remote components

**Cause:** Remote app's styles not loaded.

**Fix:** Ensure remote app's global styles are included or use `styleUrls` in components.

### 8. Auth state not shared between apps

**Cause:** AuthFacade in shell-app reads from localStorage, but auth-app writes to it.

**Verify:**
1. Login via auth-app's form
2. Check `localStorage` in browser dev tools for JWT tokens
3. Check shell-app's AuthFacade reads those tokens

---

## API Endpoints Used

### Public

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/products` | List products |
| `GET` | `/api/v1/products/:id` | Get product by ID |
| `GET` | `/api/v1/products/slug/:slug` | Get product by slug |
| `GET` | `/api/v1/categories` | List categories |
| `GET` | `/api/v1/brands` | List brands |
| `GET` | `/api/v1/products/:id/reviews` | List product reviews |

### Authenticated

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/cart` | Get cart |
| `POST` | `/api/v1/cart/items` | Add to cart |
| `PATCH` | `/api/v1/cart/items/:id` | Update cart item |
| `DELETE` | `/api/v1/cart/items/:id` | Remove from cart |
| `GET` | `/api/v1/wishlist` | Get wishlist |
| `POST` | `/api/v1/wishlist/items` | Add to wishlist |
| `DELETE` | `/api/v1/wishlist/items/:id` | Remove from wishlist |
| `POST` | `/api/v1/products/:id/reviews` | Create review |

---

## Next Steps

After Module Federation is configured:
1. Test all local routes still work (products, cart, wishlist)
2. Test remote auth routes load correctly
3. Add more remotes (admin-app, checkout-app, orders-app)
4. Set up production deployment with proper remote URLs
5. Implement shared theme via CSS custom properties
6. Add error boundaries for remote loading failures
7. Set up CI/CD for independent deployments
