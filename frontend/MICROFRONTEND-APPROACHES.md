# Microfrontend Integration Guide — Complete Reference

A comprehensive guide covering **7 microfrontend approaches** with detailed analysis for different frameworks, use cases, team structures, and authentication/authorization patterns.

---

## Table of Contents

- [Introduction](#introduction)
- [Microfrontend Concepts](#microfrontend-concepts)
- [Apps in This Project](#apps-in-this-project)
- [Authentication & Authorization Overview](#authentication--authorization-overview)
- [Approach 1: Module Federation](#approach-1-module-federation)
- [Approach 2: Native Federation](#approach-2-native-federation)
- [Approach 3: Single-SPA](#approach-3-single-spa)
- [Approach 4: Web Components (Angular Elements)](#approach-4-web-components-angular-elements)
- [Approach 5: Iframe-Based](#approach-5-iframe-based)
- [Approach 6: Route-Based Manual Loading](#approach-6-route-based-manual-loading)
- [Approach 7: npm Package Imports](#approach-7-npm-package-imports)
- [Framework Compatibility Matrix](#framework-compatibility-matrix)
- [Use Case Analysis](#use-case-analysis)
- [Authentication Patterns Deep Dive](#authentication-patterns-deep-dive)
- [Authorization Patterns Deep Dive](#authorization-patterns-deep-dive)
- [Comparison Matrix](#comparison-matrix)
- [Decision Framework](#decision-framework)
- [Migration Strategies](#migration-strategies)
- [Performance Considerations](#performance-considerations)
- [Security Considerations](#security-considerations)
- [Troubleshooting](#troubleshooting)

---

## Introduction

### What is a Microfrontend?

A microfrontend architecture splits a monolithic frontend into smaller, independently developable, testable, and deployable applications. Each microfrontend is owned by a small team and can be deployed independently without affecting other parts of the system.

### Why Use Microfrontends?

| Problem | Microfrontend Solution |
|---------|----------------------|
| Large codebase hard to maintain | Split into smaller, focused apps |
| Teams blocked by each other | Independent development and deployment |
| Slow build and deploy cycles | Deploy only changed microfrontends |
| Technology lock-in | Use different frameworks per app |
| Scaling team collaboration | Clear ownership boundaries |

### Key Principles

1. **Independent Deployment** — Each app can be deployed without rebuilding others
2. **Technology Agnostic** — Mix frameworks (Angular + React + Vue)
3. **Isolated Development** — Teams work independently
4. **Shared State When Needed** — Auth, theme, user data shared across apps
5. **Progressive Migration** — Migrate monolith incrementally

---

## Microfrontend Concepts

### Host vs Remote

| Term | Definition |
|------|-----------|
| **Host** | The main application that users interact with. Loads remote apps. |
| **Remote** | An application that exposes modules to be loaded by hosts. |
| **Orchestrator** | A thin layer that manages which app loads based on URL. |
| **Shell** | Another name for the host app. |

### Runtime vs Build-Time Integration

| Integration Type | Description | Example |
|-----------------|-------------|---------|
| **Runtime** | Apps load each other's code at runtime in the browser | Module Federation, Single-SPA |
| **Build-Time** | Apps import each other's code during build | npm packages, route-based |

### Shared vs Isolated State

| State Type | Description | Example |
|-----------|-------------|---------|
| **Shared** | State is accessible across all microfrontends | JWT tokens, user info, theme |
| **Isolated** | Each app manages its own state | Local form data, UI state |

---

## Apps in This Project

### Application Inventory

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        CommerceOS Platform                              │
│                                                                         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐        │
│  │   shell-app      │  │   auth-app       │  │   admin-app     │        │
│  │   Port: 4200     │  │   Port: 4201     │  │   Port: 4202    │        │
│  │                  │  │                  │  │                 │        │
│  │  Role: Host      │  │  Role: Remote    │  │  Role: Remote   │        │
│  │                  │  │                  │  │                 │        │
│  │  Features:       │  │  Features:       │  │  Features:      │        │
│  │  - Product list  │  │  - Login         │  │  - Dashboard    │        │
│  │  - Product detail│  │  - Register      │  │  - Products CRUD│        │
│  │  - Cart          │  │  - Forgot pw     │  │  - Orders mgmt  │        │
│  │  - Wishlist      │  │  - Reset pw      │  │  - Users mgmt   │        │
│  │  - Search        │  │  - Verify email  │  │  - Reports      │        │
│  │                  │  │  - Dashboard     │  │                 │        │
│  │  Framework:      │  │  Framework:      │  │  Framework:     │        │
│  │  Angular 22      │  │  Angular 22      │  │  Angular 22     │        │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘        │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Backend API                                   │   │
│  │                    http://localhost:3000/api/v1                   │   │
│  │                                                                  │   │
│  │  Modules: Auth | Products | Categories | Brands | Cart |       │   │
│  │           Wishlist | Orders | Checkout | Payments | Reviews |   │   │
│  │           Users | Addresses | Shipping | Coupons | Inventory   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### App Responsibilities

| App | Responsibilities | Auth Required | Owns Routes |
|-----|-----------------|:-------------:|:-----------:|
| shell-app | Storefront, product browsing, cart, wishlist | Partial (cart, wishlist) | `/`, `/products/*`, `/cart`, `/wishlist` |
| auth-app | Authentication, registration, password management | No (public pages) | `/auth/*` |
| admin-app | Admin dashboard, product/order/user management | Yes (admin role) | `/admin/*` |

---

## Authentication & Authorization Overview

### Authentication vs Authorization

| Concept | Definition | Example |
|---------|-----------|---------|
| **Authentication** | Verifying who the user is | Login with email/password |
| **Authorization** | Verifying what the user can do | Admin can delete products, user cannot |

### Auth Flow in Microfrontend Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Authentication Flow                              │
│                                                                         │
│  1. User visits http://localhost:4200/auth/login                        │
│     ↓                                                                   │
│  2. shell-app loads auth-app's login form via Module Federation         │
│     ↓                                                                   │
│  3. User enters credentials (email + password)                          │
│     ↓                                                                   │
│  4. auth-app sends POST /api/v1/auth/login                             │
│     ↓                                                                   │
│  5. Backend validates credentials, returns JWT tokens                   │
│     ↓                                                                   │
│  6. auth-app stores tokens in localStorage:                             │
│     - access_token: "eyJhbGciOiJIUzI1NiIs..."                          │
│     - refresh_token: "dGhpcyBpcyBhIHJlZnJlc2..."                      │
│     - user: { id: 1, email: "user@example.com", role: "user" }        │
│     ↓                                                                   │
│  7. auth-app dispatches custom event: window.dispatchEvent(             │
│     new CustomEvent('auth:login', { detail: { user, token } }))        │
│     ↓                                                                   │
│  8. shell-app listens for event, updates AuthFacade state               │
│     ↓                                                                   │
│  9. Header updates to show user name + logout button                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Authorization Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Authorization Flow                               │
│                                                                         │
│  1. User navigates to http://localhost:4200/admin/dashboard             │
│     ↓                                                                   │
│  2. shell-app loads admin-app via Module Federation                     │
│     ↓                                                                   │
│  3. admin-app checks authGuard:                                        │
│     - Is user authenticated? (check localStorage for JWT)              │
│     - Is user authorized? (check user.role === 'admin')                │
│     ↓                                                                   │
│  4. If not authenticated → redirect to /auth/login                      │
│  5. If authenticated but not admin → show 403 Forbidden                 │
│  6. If admin → render admin dashboard                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user",
    "isEmailVerified": true
  }
}
```

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|------------|
| `user` | Browse products, manage own cart/wishlist, view own orders |
| `admin` | All user permissions + manage products, orders, users |
| `superadmin` | All admin permissions + manage admins, system settings |

---

## Approach 1: Module Federation

**Package:** `@angular-architects/module-federation`
**Builder:** Webpack-based
**Runtime Loading:** Yes
**Framework Support:** Angular (primary), React, Vue (via webpack)

### How Module Federation Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Module Federation Runtime                           │
│                                                                         │
│  1. shell-app loads at http://localhost:4200                            │
│     ↓                                                                   │
│  2. Browser downloads shell-app's JavaScript bundles                    │
│     ↓                                                                   │
│  3. User navigates to /auth/login                                       │
│     ↓                                                                   │
│  4. Angular router triggers: loadRemoteModule('auth', './routes')       │
│     ↓                                                                   │
│  5. Module Federation runtime fetches remoteEntry.js from auth-app:     │
│     GET http://localhost:4201/remoteEntry.js                            │
│     ↓                                                                   │
│  6. remoteEntry.js contains metadata about auth-app's exposed modules  │
│     ↓                                                                   │
│  7. Runtime fetches the actual module chunks:                           │
│     GET http://localhost:4201/assets/chunk-abc123.js                    │
│     GET http://localhost:4201/assets/chunk-def456.js                    │
│     ↓                                                                   │
│  8. Module is loaded into shell-app's memory                            │
│     ↓                                                                   │
│  9. Auth-app's routes, components, and styles render in shell-app       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Complete Configuration

#### Auth App (Remote)

**angular.json changes:**
```json
{
  "projects": {
    "auth-app": {
      "architect": {
        "build": {
          "builder": "@angular-architects/module-federation",
          "options": {
            "extraWebpackConfig": "webpack.config.js",
            "browser": "src/main.ts",
            "tsConfig": "tsconfig.app.json",
            "assets": [{ "glob": "**/*", "input": "public" }],
            "styles": ["src/styles.css"]
          }
        },
        "serve": {
          "builder": "@angular-architects/module-federation",
          "options": {
            "port": 4201,
            "publicHost": "http://localhost:4201"
          }
        }
      }
    }
  }
}
```

**webpack.config.js:**
```javascript
const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  name: "auth",

  exposes: {
    "./routes": "./src/app/app.routes.ts",
    "./auth-service": "./src/app/core/services/auth.ts",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

**src/app/app.routes.ts:**
```typescript
import { Routes } from "@angular/router";
import { AuthLayout } from "./features/auth/auth-layout/auth-layout";
import { authGuard, guestGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      { path: "", redirectTo: "login", pathMatch: "full" },
      {
        path: "login",
        loadComponent: () =>
          import("./features/auth/login/login").then((m) => m.Login),
        title: "Sign In",
      },
      {
        path: "register",
        loadComponent: () =>
          import("./features/auth/register/register").then((m) => m.Register),
        title: "Create Account",
      },
      {
        path: "forgot-password",
        loadComponent: () =>
          import("./features/auth/forgot-password/forgot-password").then(
            (m) => m.ForgotPassword
          ),
        title: "Forgot Password",
      },
      {
        path: "reset-password",
        loadComponent: () =>
          import("./features/auth/reset-password/reset-password").then(
            (m) => m.ResetPassword
          ),
        title: "Reset Password",
      },
      {
        path: "verify-email",
        loadComponent: () =>
          import("./features/auth/verify-email/verify-email").then(
            (m) => m.VerifyEmail
          ),
        title: "Verify Email",
      },
      {
        path: "resend-verification",
        loadComponent: () =>
          import(
            "./features/auth/resend-verification/resend-verification"
          ).then((m) => m.ResendVerification),
        title: "Resend Verification",
      },
    ],
  },
  {
    path: "dashboard",
    canActivate: [authGuard],
    loadComponent: () =>
      import("./features/dashboard/dashboard").then((m) => m.Dashboard),
    title: "Dashboard",
  },
  { path: "**", redirectTo: "" },
];
```

**src/app/app.config.ts:**
```typescript
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";
import { provideModuleFederation } from "@angular-architects/module-federation";
import { routes } from "./app.routes";
import { authInterceptor } from "./core/interceptors/auth.interceptor";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideModuleFederation(),
  ],
};
```

**src/main.ts:**
```typescript
import { loadManifest } from "@angular-architects/module-federation";
import { bootstrapApplication } from "@angular/platform-browser";
import { App } from "./app/app";
import { appConfig } from "./app/app.config";

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
```

#### Admin App (Remote)

**webpack.config.js:**
```javascript
const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  name: "admin",

  exposes: {
    "./routes": "./src/app/app.routes.ts",
  },

  remotes: {
    auth: "http://localhost:4201/remoteEntry.js",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

**src/app/app.routes.ts (admin-app):**
```typescript
import { Routes } from "@angular/router";
import { loadRemoteModule } from "@angular-architects/module-federation";
import { AdminLayoutComponent } from "./layout/admin-layout/admin-layout.component";
import { authGuard, adminGuard } from "./core/guards/auth.guard";

export const routes: Routes = [
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: "",
        redirectTo: "dashboard",
        pathMatch: "full",
      },
      {
        path: "dashboard",
        loadComponent: () =>
          import("./features/dashboard/dashboard").then((m) => m.Dashboard),
      },
      {
        path: "products",
        loadComponent: () =>
          import("./features/products/product-list").then(
            (m) => m.ProductList
          ),
      },
      {
        path: "products/create",
        loadComponent: () =>
          import("./features/products/product-form").then(
            (m) => m.ProductForm
          ),
      },
      {
        path: "products/:id/edit",
        loadComponent: () =>
          import("./features/products/product-form").then(
            (m) => m.ProductForm
          ),
      },
      {
        path: "orders",
        loadComponent: () =>
          import("./features/orders/order-list").then((m) => m.OrderList),
      },
      {
        path: "users",
        loadComponent: () =>
          import("./features/users/user-list").then((m) => m.UserList),
      },

      // Admin also uses shared auth-app
      {
        path: "auth",
        loadChildren: () =>
          loadRemoteModule("auth", "./routes").then((m) => m.routes),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
```

#### Shell App (Host)

**webpack.config.js:**
```javascript
const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  remotes: {
    auth: "http://localhost:4201/remoteEntry.js",
    admin: "http://localhost:4202/remoteEntry.js",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

**src/app/app.routes.ts (shell-app):**
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

      // Remote auth routes
      {
        path: "auth",
        loadChildren: () =>
          loadRemoteModule("auth", "./routes").then((m) => m.routes),
      },

      // Remote admin routes
      {
        path: "admin",
        loadChildren: () =>
          loadRemoteModule("admin", "./routes").then((m) => m.routes),
      },
    ],
  },
];
```

### Authentication with Module Federation

#### Token Sharing Strategy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Token Sharing via localStorage                        │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  auth-app        │                                                    │
│  │  (Remote)        │                                                    │
│  │                  │                                                    │
│  │  1. Login form   │                                                    │
│  │  2. POST /login  │                                                    │
│  │  3. Store tokens │──────► localStorage                               │
│  │  4. Dispatch     │         {                                          │
│  │     event        │           access_token: "eyJ...",                 │
│  └─────────────────┘           refresh_token: "dGh...",                 │
│                                 user: { id, email, role }               │
│  ┌─────────────────┐         }                                          │
│  │  shell-app       │                                                    │
│  │  (Host)          │                                                    │
│  │                  │                                                    │
│  │  1. Listen for   │◄────── localStorage                               │
│  │     auth:login   │                                                    │
│  │  2. Update state │                                                    │
│  │  3. Show header  │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  admin-app       │                                                    │
│  │  (Remote)        │                                                    │
│  │                  │                                                    │
│  │  1. Read tokens  │◄────── localStorage                               │
│  │     on init      │                                                    │
│  │  2. Validate     │                                                    │
│  │  3. Show admin   │                                                    │
│  └─────────────────┘                                                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Auth Event Bus Implementation

```typescript
// shared/auth-event-bus.ts
export class AuthEventBus {
  private static instance: AuthEventBus;
  private listeners: Map<string, Function[]> = new Map();

  static getInstance(): AuthEventBus {
    if (!AuthEventBus.instance) {
      AuthEventBus.instance = new AuthEventBus();
    }
    return AuthEventBus.instance;
  }

  on(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach((cb) => cb(data));
  }
}

// auth-app: After successful login
const authBus = AuthEventBus.getInstance();
authBus.emit("auth:login", { user, token });

// shell-app: Listen for login
const authBus = AuthEventBus.getInstance();
authBus.on("auth:login", ({ user, token }) => {
  this.authFacade.setAuthenticated(user, token);
});

// admin-app: Listen for login
const authBus = AuthEventBus.getInstance();
authBus.on("auth:login", ({ user, token }) => {
  this.adminFacade.setAuthenticated(user, token);
});
```

#### HTTP Interceptor for Token Injection

```typescript
// shared/auth.interceptor.ts
import { HttpInterceptorFn } from "@angular/common/http";

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem("access_token");

  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
    return next(cloned);
  }

  return next(req);
};
```

#### Token Refresh Strategy

```typescript
// shared/token-refresh.service.ts
import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Router } from "@angular/router";
import { catchError, switchMap, throwError } from "rxjs";

@Injectable({ providedIn: "root" })
export class TokenRefreshService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private isRefreshing = false;

  refreshToken(): Observable<any> {
    const refreshToken = localStorage.getItem("refresh_token");

    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error("No refresh token"));
    }

    if (this.isRefreshing) {
      return throwError(() => new Error("Already refreshing"));
    }

    this.isRefreshing = true;

    return this.http
      .post("/api/v1/auth/refresh", { refreshToken })
      .pipe(
        switchMap((response: any) => {
          localStorage.setItem("access_token", response.accessToken);
          localStorage.setItem("refresh_token", response.refreshToken);
          this.isRefreshing = false;
          return of(response);
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.logout();
          return throwError(() => error);
        })
      );
  }

  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    this.router.navigate(["/auth/login"]);
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| True runtime integration | Requires webpack (not esbuild) |
| Shared dependencies (single Angular) | Complex configuration |
| Lazy loading built-in | Version coupling between apps |
| Code splitting automatic | HMR limitations |
| Angular router integration | Learning curve |

---

## Approach 2: Native Federation

**Package:** `@angular-architects/native-federation`
**Builder:** esbuild-based (modern, faster)
**Runtime Loading:** Yes
**Framework Support:** Angular (primary)

### How Native Federation Works

Same concept as Module Federation but uses esbuild instead of webpack. Faster builds, simpler configuration.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Native Federation Runtime                           │
│                                                                         │
│  1. shell-app loads at http://localhost:4200                            │
│     ↓                                                                   │
│  2. Browser downloads shell-app's esbuild bundles                       │
│     ↓                                                                   │
│  3. User navigates to /auth/login                                       │
│     ↓                                                                   │
│  4. Angular router triggers: loadRemoteModule('auth', './routes')       │
│     ↓                                                                   │
│  5. Native Federation runtime fetches remoteEntry.json from auth-app:   │
│     GET http://localhost:4201/remoteEntry.json                          │
│     ↓                                                                   │
│  6. remoteEntry.json contains metadata about auth-app's exposed modules│
│     ↓                                                                   │
│  7. Runtime fetches the actual module chunks:                           │
│     GET http://localhost:4201/assets/chunk-abc123.js                    │
│     ↓                                                                   │
│  8. Module is loaded into shell-app's memory                            │
│     ↓                                                                   │
│  9. Auth-app's routes render in shell-app                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

#### Auth App (Remote)

```bash
npx ng add @angular-architects/native-federation --project auth-app --port 4201 --type remote
```

**federation.config.js:**
```javascript
const {
  shareAll,
  withNativeFederation,
} = require("@angular-architects/native-federation");

module.exports = withNativeFederation({
  name: "auth",

  exposes: {
    "./routes": "./src/app/app.routes.ts",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

#### Admin App (Remote)

```bash
npx ng add @angular-architects/native-federation --project admin-app --port 4202 --type remote
```

**federation.config.js:**
```javascript
const {
  shareAll,
  withNativeFederation,
} = require("@angular-architects/native-federation");

module.exports = withNativeFederation({
  name: "admin",

  exposes: {
    "./routes": "./src/app/app.routes.ts",
  },

  remotes: {
    auth: "http://localhost:4201/remoteEntry.json",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

#### Shell App (Host)

```bash
npx ng add @angular-architects/native-federation --project shell-app --port 4200 --type host
```

**federation.config.js:**
```javascript
const {
  shareAll,
  withNativeFederation,
} = require("@angular-architects/native-federation");

module.exports = withNativeFederation({
  remotes: {
    auth: "http://localhost:4201/remoteEntry.json",
    admin: "http://localhost:4202/remoteEntry.json",
  },

  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: "auto",
    }),
  },
});
```

### Authentication with Native Federation

Same pattern as Module Federation — tokens in localStorage, event bus for communication, shared interceptors.

### Pros & Cons

| Pros | Cons |
|------|------|
| No webpack dependency | Newer, less mature |
| Faster builds (esbuild) | Smaller community |
| Same runtime benefits as MF | Different config format |
| Modern Angular tooling | Migration effort from classic MF |
| Smaller bundle sizes | Less documentation available |

---

## Approach 3: Single-SPA

**Package:** `single-spa` + `single-spa-angular`
**Builder:** Any (webpack, esbuild, Vite)
**Runtime Loading:** Yes
**Framework Support:** Angular, React, Vue, Svelte, or any framework

### How Single-SPA Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Single-SPA Orchestrator                             │
│                                                                         │
│  1. User visits http://localhost:4200/products                          │
│     ↓                                                                   │
│  2. Single-SPA checks activeWhen rules:                                 │
│     - shell: activeWhen: ["/", "/products", "/cart"] → MATCH           │
│     ↓                                                                   │
│  3. Single-SPA loads shell-app's bundle                                 │
│     ↓                                                                   │
│  4. User clicks "Sign in"                                               │
│     ↓                                                                   │
│  5. URL changes to /auth/login                                          │
│     ↓                                                                   │
│  6. Single-SPA checks activeWhen rules:                                 │
│     - auth: activeWhen: ["/auth"] → MATCH                               │
│     - shell: activeWhen: ["/", "/products"] → NO MATCH                  │
│     ↓                                                                   │
│  7. Single-SPA unmounts shell-app                                       │
│  8. Single-SPA mounts auth-app                                          │
│     ↓                                                                   │
│  9. auth-app renders its login form                                     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

#### Orchestrator App

```bash
npx create-single-spa --framework angular
```

**src/app/app.routes.ts:**
```typescript
import { registerApplication } from "single-spa";

registerApplication({
  name: "shell",
  app: () => System.import("@company/shell-app"),
  activeWhen: ["/", "/products", "/cart", "/wishlist"],
});

registerApplication({
  name: "auth",
  app: () => System.import("@company/auth-app"),
  activeWhen: ["/auth"],
});

registerApplication({
  name: "admin",
  app: () => System.import("@company/admin-app"),
  activeWhen: ["/admin"],
});
```

#### Auth App Setup

```bash
npm add single-spa single-spa-angular
```

**src/main.ts:**
```typescript
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { singleSpaAngular } from "single-spa-angular";
import { App } from "./app/app";

const lifecycles = singleSpaAngular({
  bootstrapModule: () => platformBrowserDynamic().bootstrapModule(App),
  // Optional: DOM element selector for mounting
  DOMElementGetter: () => document.getElementById("auth-app-container"),
});

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
```

### Authentication with Single-SPA

```typescript
// auth-app: After login
localStorage.setItem("access_token", token);
localStorage.setItem("user", JSON.stringify(user));

// Dispatch custom event for other apps
window.dispatchEvent(
  new CustomEvent("auth:login", {
    detail: { user, token },
  })
);

// shell-app: Listen for auth changes
window.addEventListener("auth:login", ((event: CustomEvent) => {
  const { user, token } = event.detail;
  this.authFacade.setAuthenticated(user, token);
}) as EventListener);

// admin-app: Listen for auth changes
window.addEventListener("auth:login", ((event: CustomEvent) => {
  const { user, token } = event.detail;
  this.adminFacade.setAuthenticated(user, token);
}) as EventListener);
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Framework agnostic (Angular + React + Vue) | No shared Angular (duplicate bundles) |
| Well-established ecosystem | More boilerplate |
| Clear app boundaries | Extra orchestrator layer |
| Independent deployment | Larger bundle size |
| Fine-grained loading control | Complex routing configuration |

---

## Approach 4: Web Components (Angular Elements)

**Package:** `@angular/elements`
**Builder:** Any
**Runtime Loading:** No (build-time integration)
**Framework Support:** Angular (exports), Any framework (imports)

### How Web Components Work

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Web Components Architecture                         │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  auth-app (Builds as Angular Elements)                          │   │
│  │                                                                  │   │
│  │  Components exported as custom elements:                        │   │
│  │  - <app-auth-login>                                             │   │
│  │  - <app-auth-register>                                          │   │
│  │  - <app-auth-dashboard>                                         │   │
│  │                                                                  │   │
│  │  Output: dist/auth-app/ (contains custom elements bundle)       │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app (Host)                                               │   │
│  │                                                                  │   │
│  │  <app-auth-login                                                │   │
│  │    (onLogin)="handleLogin($event)"                              │   │
│  │    (onNavigate)="handleNavigate($event)">                       │   │
│  │  </app-auth-login>                                              │   │
│  │                                                                  │   │
│  │  No Angular router integration — manual event handling          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  admin-app (Also uses same custom elements)                     │   │
│  │                                                                  │   │
│  │  <app-auth-login                                                │   │
│  │    (onLogin)="handleLogin($event)">                             │   │
│  │  </app-auth-login>                                              │   │
│  │                                                                  │   │
│  │  Same custom elements, same auth-app, different host            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

#### Auth App Setup

```bash
npm add @angular/elements
```

**src/app/auth-elements.ts:**
```typescript
import { createApplication } from "@angular/platform-browser";
import { AuthLogin } from "./features/auth/login/login";
import { AuthRegister } from "./features/auth/register/register";
import { AuthDashboard } from "./features/dashboard/dashboard";

(async () => {
  const app = await createApplication();

  customElements.define(
    "app-auth-login",
    createCustomElement(AuthLogin, { injector: app.injector })
  );

  customElements.define(
    "app-auth-register",
    createCustomElement(AuthRegister, { injector: app.injector })
  );

  customElements.define(
    "app-auth-dashboard",
    createCustomElement(AuthDashboard, { injector: app.injector })
  );
})();
```

**angular.json (build config):**
```json
{
  "projects": {
    "auth-app": {
      "architect": {
        "build": {
          "options": {
            "main": "src/app/auth-elements.ts",
            "outputPath": "dist/auth-app"
          }
        }
      }
    }
  }
}
```

#### Shell App Usage

```typescript
// shell-app.component.ts
import { Component } from "@angular/core";

@Component({
  selector: "app-shell",
  template: `
    <app-header></app-header>

    @if (currentRoute === "/auth/login") {
      <app-auth-login
        (onLogin)="handleLogin($event)"
        (onNavigate)="handleNavigate($event)"
      ></app-auth-login>
    } @else if (currentRoute === "/auth/register") {
      <app-auth-register
        (onRegister)="handleRegister($event)"
      ></app-auth-register>
    } @else {
      <router-outlet></router-outlet>
    }

    <app-footer></app-footer>
  `,
})
export class ShellComponent {
  currentRoute = "";

  handleLogin(event: CustomEvent) {
    const { user, token } = event.detail;
    this.authFacade.setAuthenticated(user, token);
    this.router.navigate(["/"]);
  }

  handleNavigate(event: CustomEvent) {
    const { route } = event.detail;
    this.router.navigate([route]);
  }
}
```

#### Admin App Usage

```typescript
// admin-app.component.ts
@Component({
  selector: "app-admin",
  template: `
    <app-admin-sidebar></app-admin-sidebar>

    @if (currentRoute === "/auth/login") {
      <app-auth-login
        (onLogin)="handleLogin($event)"
      ></app-auth-login>
    } @else {
      <router-outlet></router-outlet>
    }
  `,
})
export class AdminComponent {
  handleLogin(event: CustomEvent) {
    const { user, token } = event.detail;
    this.adminFacade.setAuthenticated(user, token);
  }
}
```

### Authentication with Web Components

```typescript
// auth-app: AuthLogin component emits events
@Component({
  selector: "app-auth-login",
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="email" name="email" type="email" />
      <input [(ngModel)]="password" name="password" type="password" />
      <button type="submit">Sign In</button>
    </form>
  `,
})
export class AuthLogin {
  @Output() onLogin = new EventEmitter<any>();
  @Output() onNavigate = new EventEmitter<any>();

  email = "";
  password = "";

  constructor(private authService: AuthService) {}

  async onSubmit() {
    const result = await this.authService.login(this.email, this.password);
    this.onLogin.emit(result);
  }

  goToRegister() {
    this.onNavigate.emit({ route: "/auth/register" });
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Native browser API | No Angular router integration |
| Works in any host (React, Vue, plain HTML) | Manual event/prop passing |
| True encapsulation | No shared Angular instance |
| Simple integration | CSS isolation challenges |
| Framework agnostic exports | Limited inter-component communication |

---

## Approach 5: Iframe-Based

**Package:** None (native browser)
**Builder:** Any
**Runtime Loading:** Yes
**Framework Support:** Any (complete isolation)

### How Iframe-Based Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Iframe-Based Architecture                           │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app (Host)                                               │   │
│  │                                                                  │   │
│  │  <iframe                                                        │   │
│  │    src="http://localhost:4201/auth/login"                       │   │
│  │    (load)="handleIframeLoad($event)"                            │   │
│  │    style="width: 100%; height: 600px; border: none;"            │   │
│  │  ></iframe>                                                     │   │
│  │                                                                  │   │
│  │  Communication via postMessage API                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  auth-app (Inside iframe)                                       │   │
│  │                                                                  │   │
│  │  Runs completely independently:                                 │   │
│  │  - Own Angular instance                                         │   │
│  │  - Own router                                                   │   │
│  │  - Own styles                                                   │   │
│  │                                                                  │   │
│  │  After login:                                                   │   │
│  │  window.parent.postMessage({                                    │   │
│  │    type: "LOGIN_SUCCESS",                                       │   │
│  │    user: { id, email, role },                                   │   │
│  │    token: "eyJ..."                                              │   │
│  │  }, "http://localhost:4200");                                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

#### Auth App Setup

No special configuration needed — just run as standalone app.

```bash
cd auth-app
npm start  # → http://localhost:4201
```

#### Shell App Usage

```typescript
// shell-app.component.ts
@Component({
  selector: "app-shell",
  template: `
    <app-header></app-header>

    @if (showAuthIframe) {
      <iframe
        [src]="authIframeUrl"
        (load)="handleIframeLoad($event)"
        style="width: 100%; height: 600px; border: none;"
      ></iframe>
    } @else {
      <router-outlet></router-outlet>
    }

    <app-footer></app-footer>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  showAuthIframe = false;
  authIframeUrl = "";
  private messageListener?: (event: MessageEvent) => void;

  constructor(
    private router: Router,
    private authFacade: AuthFacade,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.messageListener = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== "http://localhost:4201") return;

      if (event.data.type === "LOGIN_SUCCESS") {
        const { user, token } = event.data;
        this.authFacade.setAuthenticated(user, token);
        this.showAuthIframe = false;
        this.router.navigate(["/"]);
      }

      if (event.data.type === "REGISTER_SUCCESS") {
        this.showAuthIframe = false;
        this.router.navigate(["/auth/login"]);
      }
    };

    window.addEventListener("message", this.messageListener);
  }

  ngOnDestroy() {
    if (this.messageListener) {
      window.removeEventListener("message", this.messageListener);
    }
  }

  navigateToLogin() {
    this.authIframeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
      "http://localhost:4201/auth/login"
    );
    this.showAuthIframe = true;
  }

  handleIframeLoad(event: Event) {
    // Iframe loaded
  }
}
```

#### Auth App Communication

```typescript
// auth-app: login.component.ts
@Component({
  selector: "app-login",
  template: `
    <form (ngSubmit)="onSubmit()">
      <input [(ngModel)]="email" name="email" type="email" />
      <input [(ngModel)]="password" name="password" type="password" />
      <button type="submit">Sign In</button>
    </form>
  `,
})
export class Login {
  email = "";
  password = "";

  constructor(private authService: AuthService) {}

  async onSubmit() {
    const result = await this.authService.login(this.email, this.password);

    // Send message to parent window (shell-app)
    window.parent.postMessage(
      {
        type: "LOGIN_SUCCESS",
        user: result.user,
        token: result.token,
      },
      "http://localhost:4200" // Target origin for security
    );
  }
}
```

### Authentication with Iframes

```typescript
// auth-app: Token storage in iframe context
// Note: localStorage is per-origin, so iframe has its own localStorage
// To share tokens, use postMessage

// auth-app: After login
const tokenData = {
  accessToken: response.accessToken,
  refreshToken: response.refreshToken,
  user: response.user,
};

// Send to parent
window.parent.postMessage(
  {
    type: "LOGIN_SUCCESS",
    ...tokenData,
  },
  "http://localhost:4200"
);

// shell-app: Receive and store
this.messageListener = (event: MessageEvent) => {
  if (event.data.type === "LOGIN_SUCCESS") {
    // Store in shell-app's localStorage
    localStorage.setItem("access_token", event.data.accessToken);
    localStorage.setItem("refresh_token", event.data.refreshToken);
    localStorage.setItem("user", JSON.stringify(event.data.user));
  }
};
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Complete isolation | Poor UX (scrollbar, sizing issues) |
| Zero configuration | No shared state without postMessage |
| Independent deployment | Performance overhead |
| Security isolation | Deep linking difficult |
| Works with any framework | Communication complexity |

---

## Approach 6: Route-Based Manual Loading

**Package:** None (standard Angular)
**Builder:** Any
**Runtime Loading:** Yes (via dynamic imports)
**Framework Support:** Angular only

### How Route-Based Loading Works

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      Route-Based Manual Loading                          │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app (Host)                                               │   │
│  │                                                                  │   │
│  │  app.routes.ts:                                                 │   │
│  │  {                                                              │   │
│  │    path: "auth",                                                │   │
│  │    loadChildren: () =>                                          │   │
│  │      import("./features/auth/auth.routes").then(m => m.routes)  │   │
│  │  }                                                              │   │
│  │                                                                  │   │
│  │  At build time, Angular CLI bundles auth routes into            │   │
│  │  separate chunks that are loaded on demand                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  admin-app (Host)                                               │   │
│  │                                                                  │   │
│  │  app.routes.ts:                                                 │   │
│  │  {                                                              │   │
│  │    path: "auth",                                                │   │
│  │    loadChildren: () =>                                          │   │
│  │      import("./features/auth/auth.routes").then(m => m.routes)  │   │
│  │  }                                                              │   │
│  │                                                                  │   │
│  │  Both apps import the SAME auth module at build time            │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

#### Auth Module Structure

```
shared/
└── auth/
    ├── auth.module.ts
    ├── auth.routes.ts
    ├── components/
    │   ├── login/
    │   ├── register/
    │   ├── forgot-password/
    │   └── reset-password/
    ├── guards/
    │   └── auth.guard.ts
    └── services/
        └── auth.service.ts
```

**shared/auth/auth.routes.ts:**
```typescript
import { Routes } from "@angular/router";
import { AuthLayout } from "./components/auth-layout/auth-layout";
import { authGuard, guestGuard } from "./guards/auth.guard";

export const AUTH_ROUTES: Routes = [
  {
    path: "",
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      { path: "", redirectTo: "login", pathMatch: "full" },
      {
        path: "login",
        loadComponent: () =>
          import("./components/login/login").then((m) => m.Login),
      },
      {
        path: "register",
        loadComponent: () =>
          import("./components/register/register").then((m) => m.Register),
      },
      {
        path: "forgot-password",
        loadComponent: () =>
          import("./components/forgot-password/forgot-password").then(
            (m) => m.ForgotPassword
          ),
      },
      {
        path: "reset-password",
        loadComponent: () =>
          import("./components/reset-password/reset-password").then(
            (m) => m.ResetPassword
          ),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
```

#### Shell App Usage

```typescript
// shell-app/app.routes.ts
import { AUTH_ROUTES } from "./shared/auth/auth.routes";

export const routes: Routes = [
  {
    path: "",
    component: ShellComponent,
    children: [
      { path: "", loadComponent: () => import("./features/home/home.page").then(m => m.HomePage) },
      { path: "products", loadComponent: () => import("./features/catalog/product-list.page").then(m => m.ProductListPage) },
      { path: "cart", loadComponent: () => import("./features/cart/cart.page").then(m => m.CartPage) },

      // Auth routes imported directly
      {
        path: "auth",
        children: AUTH_ROUTES,
      },
    ],
  },
];
```

#### Admin App Usage

```typescript
// admin-app/app.routes.ts
import { AUTH_ROUTES } from "./shared/auth/auth.routes";

export const routes: Routes = [
  {
    path: "",
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: "dashboard", loadComponent: () => import("./features/dashboard/dashboard").then(m => m.Dashboard) },
      { path: "products", loadComponent: () => import("./features/products/product-list").then(m => m.ProductList) },

      // Same auth routes imported
      {
        path: "auth",
        children: AUTH_ROUTES,
      },
    ],
  },
];
```

### Authentication with Route-Based Loading

```typescript
// shared/auth/services/auth.service.ts
@Injectable({ providedIn: "root" })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  async login(email: string, password: string): Promise<AuthResult> {
    const response = await this.http
      .post<AuthResponse>("/api/v1/auth/login", { email, password })
      .toPromise();

    localStorage.setItem("access_token", response.accessToken);
    localStorage.setItem("refresh_token", response.refreshToken);
    localStorage.setItem("user", JSON.stringify(response.user));

    return response;
  }

  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    this.router.navigate(["/auth/login"]);
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  }

  getUser(): User | null {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  }
}
```

### Pros & Cons

| Pros | Cons |
|------|------|
| No special packages | No runtime loading |
| Simple architecture | Must rebuild both apps when auth changes |
| Standard Angular tools | No independent deployment |
| Easy debugging | Tight coupling |
| Type safety | Auth code duplicated in each app's bundle |

---

## Approach 7: npm Package Imports

**Package:** Publish auth-app as npm package
**Builder:** Any
**Runtime Loading:** No (build-time)
**Framework Support:** Angular (published as Angular package)

### How npm Package Imports Work

```
┌─────────────────────────────────────────────────────────────────────────┐
│                      npm Package Architecture                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  auth-app (Published as @company/auth-app)                      │   │
│  │                                                                  │   │
│  │  npm publish @company/auth-app                                  │   │
│  │                                                                  │   │
│  │  Output:                                                        │   │
│  │  - dist/auth-app/fesm2022/auth-app.mjs (ESM bundle)            │   │
│  │  - dist/auth-app/auth-app.d.ts (TypeScript definitions)        │   │
│  │  - package.json (metadata)                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app (Host)                                               │   │
│  │                                                                  │   │
│  │  npm add @company/auth-app                                      │   │
│  │                                                                  │   │
│  │  app.routes.ts:                                                 │   │
│  │  import { AUTH_ROUTES } from "@company/auth-app";               │   │
│  │                                                                  │   │
│  │  {                                                              │   │
│  │    path: "auth",                                                │   │
│  │    children: AUTH_ROUTES                                        │   │
│  │  }                                                              │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  admin-app (Also uses same package)                             │   │
│  │                                                                  │   │
│  │  npm add @company/auth-app                                      │   │
│  │                                                                  │   │
│  │  import { AUTH_ROUTES } from "@company/auth-app";               │   │
│  │                                                                  │   │
│  │  Both apps use the EXACT SAME package version                   │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Configuration

#### Auth App Setup

**package.json:**
```json
{
  "name": "@company/auth-app",
  "version": "1.0.0",
  "main": "dist/auth-app/fesm2022/auth-app.mjs",
  "types": "dist/auth-app/auth-app.d.ts",
  "peerDependencies": {
    "@angular/common": "^22.0.0",
    "@angular/core": "^22.0.0",
    "@angular/forms": "^22.0.0",
    "@angular/router": "^22.0.0"
  },
  "dependencies": {
    "tslib": "^2.3.0"
  }
}
```

**Build:**
```bash
ng build --configuration production
npm publish --access public
```

#### Shell App Usage

```bash
npm add @company/auth-app
```

```typescript
// shell-app/app.routes.ts
import { AUTH_ROUTES, AUTH_PROVIDERS } from "@company/auth-app";

export const routes: Routes = [
  {
    path: "",
    component: ShellComponent,
    children: [
      { path: "", loadComponent: () => import("./features/home/home.page").then(m => m.HomePage) },
      { path: "products", loadComponent: () => import("./features/catalog/product-list.page").then(m => m.ProductListPage) },
      { path: "cart", loadComponent: () => import("./features/cart/cart.page").then(m => m.CartPage) },

      // Auth routes from npm package
      {
        path: "auth",
        children: AUTH_ROUTES,
      },
    ],
  },
];

// shell-app/app.config.ts
import { AUTH_PROVIDERS } from "@company/auth-app";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...AUTH_PROVIDERS,  // Auth providers from package
  ],
};
```

#### Admin App Usage

```bash
npm add @company/auth-app
```

```typescript
// admin-app/app.routes.ts
import { AUTH_ROUTES, AUTH_PROVIDERS } from "@company/auth-app";

export const routes: Routes = [
  {
    path: "",
    component: AdminLayoutComponent,
    children: [
      { path: "dashboard", loadComponent: () => import("./features/dashboard/dashboard").then(m => m.Dashboard) },

      // Same auth routes from package
      {
        path: "auth",
        children: AUTH_ROUTES,
      },
    ],
  },
];

// admin-app/app.config.ts
import { AUTH_PROVIDERS } from "@company/auth-app";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    ...AUTH_PROVIDERS,
  ],
};
```

### Authentication with npm Packages

```typescript
// @company/auth-app exports
export { AUTH_ROUTES } from "./lib/auth.routes";
export { AUTH_PROVIDERS } from "./lib/auth.providers";
export { AuthService } from "./lib/services/auth.service";
export { AuthGuard } from "./lib/guards/auth.guard";
export { AuthFacade } from "./lib/facades/auth.facade";
export { User, AuthResult, AuthTokens } from "./lib/models/auth.model";
```

### Pros & Cons

| Pros | Cons |
|------|------|
| Type safety (TypeScript imports) | No runtime loading |
| Standard npm workflow | Must rebuild both apps when auth changes |
| Simple dependency management | No independent deployment |
| Works with any build tool | Tight coupling |
| Version pinning | Auth code bundled in each app |

---

## Framework Compatibility Matrix

### Which Approaches Work with Which Frameworks?

| Approach | Angular | React | Vue | Svelte | Any Framework |
|----------|:-------:|:-----:|:---:|:------:|:-------------:|
| **Module Federation** | Yes | Yes | Yes | Yes | Limited |
| **Native Federation** | Yes | No | No | No | No |
| **Single-SPA** | Yes | Yes | Yes | Yes | Yes |
| **Web Components** | Yes | Yes | Yes | Yes | Yes |
| **Iframe** | Yes | Yes | Yes | Yes | Yes |
| **Route-Based** | Yes | Yes | Yes | Yes | Limited |
| **npm Packages** | Yes | Yes | Yes | Yes | Limited |

### Framework-Specific Considerations

#### Angular

| Approach | Angular Version | Notes |
|----------|----------------|-------|
| Module Federation | 14+ | Use `@angular-architects/module-federation` |
| Native Federation | 17+ | Use `@angular-architects/native-federation` |
| Single-SPA | 12+ | Use `single-spa-angular` |
| Web Components | 13+ | Use `@angular/elements` |
| Iframe | Any | No special packages |
| Route-Based | Any | Standard lazy loading |
| npm Packages | Any | Standard npm imports |

#### React

| Approach | React Version | Notes |
|----------|--------------|-------|
| Module Federation | 16+ | Use `@module-federation/enhanced` |
| Single-SPA | 16+ | Use `single-spa-react` |
| Web Components | 16+ | Use `@lion/web-components` or native |
| Iframe | Any | No special packages |
| Route-Based | 16+ | Use `React.lazy()` |
| npm Packages | Any | Standard npm imports |

#### Vue

| Approach | Vue Version | Notes |
|----------|------------|-------|
| Module Federation | 3+ | Use `@module-federation/enhanced` |
| Single-SPA | 3+ | Use `single-spa-vue` |
| Web Components | 3+ | Use `@lion/web-components` or native |
| Iframe | Any | No special packages |
| Route-Based | 3+ | Use `defineAsyncComponent()` |
| npm Packages | Any | Standard npm imports |

---

## Use Case Analysis

### Use Case 1: E-Commerce Platform

**Scenario:** Multiple teams building different parts of an e-commerce site.

| App | Team | Framework | Approach |
|-----|------|-----------|----------|
| shell-app | Storefront Team | Angular | Module Federation |
| auth-app | Auth Team | Angular | Module Federation (remote) |
| admin-app | Admin Team | Angular | Module Federation (remote) |
| checkout-app | Checkout Team | React | Module Federation (remote) |

**Why Module Federation:**
- Same framework (Angular + React via MF)
- Shared auth state needed
- Independent deployment required
- Runtime integration for seamless UX

### Use Case 2: Enterprise Portal

**Scenario:** Different departments with different technology preferences.

| App | Department | Framework | Approach |
|-----|-----------|-----------|----------|
| portal-app | IT | Angular | Single-SPA |
| hr-app | Human Resources | React | Single-SPA |
| finance-app | Finance | Vue | Single-SPA |
| auth-app | Shared Services | Angular | Single-SPA (remote) |

**Why Single-SPA:**
- Multiple frameworks (Angular + React + Vue)
- Complete app isolation needed
- Department-level autonomy

### Use Case 3: Widget-Based Dashboard

**Scenario:** Embedding various widgets into a dashboard.

| Widget | Owner | Framework | Approach |
|--------|-------|-----------|----------|
| dashboard-app | Platform Team | Angular | Web Components |
| auth-widget | Auth Team | Angular | Web Components |
| chart-widget | Data Team | React | Web Components |
| notification-widget | Platform Team | Angular | Web Components |

**Why Web Components:**
- Mix of Angular and React widgets
- No router integration needed
- Simple embedding via HTML tags

### Use Case 4: Legacy Integration

**Scenario:** Integrating legacy apps with modern frontend.

| App | Age | Framework | Approach |
|-----|-----|-----------|----------|
| modern-app | New | Angular | Iframe |
| legacy-app | Old | jQuery | Iframe |
| auth-app | Old | AngularJS | Iframe |

**Why Iframe:**
- Complete isolation from legacy code
- No refactoring needed for legacy apps
- Security boundary between old and new

### Use Case 5: Component Library

**Scenario:** Shared component library across multiple apps.

| Package | Purpose | Approach |
|---------|---------|----------|
| @company/auth | Authentication components | npm Package |
| @company/ui | UI components | npm Package |
| @company/utils | Utility functions | npm Package |

**Why npm Package:**
- Type safety
- Standard npm workflow
- No runtime loading needed
- Version control

---

## Authentication Patterns Deep Dive

### Pattern 1: Centralized Auth Service

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Centralized Auth Service                              │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  auth-app (Centralized)                                         │   │
│  │                                                                  │   │
│  │  AuthService:                                                   │   │
│  │  - login()                                                      │   │
│  │  - logout()                                                     │   │
│  │  - refreshToken()                                               │   │
│  │  - getUser()                                                    │   │
│  │  - isAuthenticated()                                            │   │
│  │                                                                  │   │
│  │  Stores:                                                        │   │
│  │  - localStorage: access_token, refresh_token, user              │   │
│  │  - Memory: AuthState (signal-based)                             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app (Consumer)                                           │   │
│  │                                                                  │   │
│  │  AuthFacade:                                                    │   │
│  │  - Reads from localStorage                                      │   │
│  │  - Listens for auth:login events                                │   │
│  │  - Updates local AuthState                                      │   │
│  │                                                                  │   │
│  │  Does NOT have its own AuthService                              │   │
│  │  Delegates to auth-app for all auth operations                  │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  admin-app (Consumer)                                           │   │
│  │                                                                  │   │
│  │  AdminAuthFacade:                                               │   │
│  │  - Reads from localStorage                                      │   │
│  │  - Listens for auth:login events                                │   │
│  │  - Checks user.role === 'admin'                                 │   │
│  │  - Updates local AuthState                                      │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pattern 2: Shared Auth Module

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Shared Auth Module                                    │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shared/auth/ (Shared between all apps)                         │   │
│  │                                                                  │   │
│  │  AuthService:                                                   │   │
│  │  - login()                                                      │   │
│  │  - logout()                                                     │   │
│  │  - refreshToken()                                               │   │
│  │                                                                  │   │
│  │  AuthGuard:                                                     │   │
│  │  - canActivate()                                                │   │
│  │  - Checks authentication status                                 │   │
│  │                                                                  │   │
│  │  AuthInterceptor:                                               │   │
│  │  - Adds Bearer token to requests                                │   │
│  │  - Handles 401 refresh                                          │   │
│  │                                                                  │   │
│  │  TokenStorage:                                                  │   │
│  │  - getToken()                                                   │   │
│  │  - setToken()                                                   │   │
│  │  - clearTokens()                                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app imports shared/auth                                  │   │
│  │  admin-app imports shared/auth                                  │   │
│  │                                                                  │   │
│  │  Same code, same behavior, same tokens                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pattern 3: Auth via External Provider

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Auth via External Provider                            │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  Auth0 / Firebase Auth / AWS Cognito                            │   │
│  │                                                                  │   │
│  │  External auth service handles:                                 │   │
│  │  - Login / Register                                             │   │
│  │  - Token management                                             │   │
│  │  - Password reset                                               │   │
│  │  - Social login                                                 │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  shell-app                                                      │   │
│  │  - Uses Auth0 SDK                                              │   │
│  │  - Login redirects to Auth0                                     │   │
│  │  - Callback receives tokens                                     │   │
│  │  - Stores tokens in localStorage                                │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │  admin-app                                                      │   │
│  │  - Uses same Auth0 SDK                                          │   │
│  │  - Reads tokens from localStorage                               │   │
│  │  - Validates token with Auth0                                    │   │
│  │  - Checks user metadata for admin role                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Authorization Patterns Deep Dive

### Pattern 1: Role-Based Access Control (RBAC)

```typescript
// shared/auth/guards/role.guard.ts
import { inject } from "@angular/core";
import { CanActivateFn, Router } from "@angular/router";
import { AuthService } from "../services/auth.service";

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();

    if (!user) {
      router.navigate(["/auth/login"]);
      return false;
    }

    if (!allowedRoles.includes(user.role)) {
      router.navigate(["/unauthorized"]);
      return false;
    }

    return true;
  };
};

// Usage in routes:
{
  path: "admin",
  canActivate: [authGuard, roleGuard(["admin"])],
  loadChildren: () => import("./admin.routes").then(m => m.ADMIN_ROUTES),
}
```

### Pattern 2: Permission-Based Access Control

```typescript
// shared/auth/models/permissions.model.ts
export enum Permission {
  // Product permissions
  VIEW_PRODUCTS = "view_products",
  CREATE_PRODUCT = "create_product",
  EDIT_PRODUCT = "edit_product",
  DELETE_PRODUCT = "delete_product",

  // Order permissions
  VIEW_ORDERS = "view_orders",
  MANAGE_ORDERS = "manage_orders",

  // User permissions
  VIEW_USERS = "view_users",
  MANAGE_USERS = "manage_users",

  // Admin permissions
  MANAGE_ADMINS = "manage_admins",
  SYSTEM_SETTINGS = "system_settings",
}

// shared/auth/guards/permission.guard.ts
export const permissionGuard = (requiredPermissions: Permission[]): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();

    if (!user) {
      router.navigate(["/auth/login"]);
      return false;
    }

    const userPermissions = authService.getUserPermissions(user.id);
    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      router.navigate(["/unauthorized"]);
      return false;
    }

    return true;
  };
};

// Usage in routes:
{
  path: "products",
  canActivate: [authGuard, permissionGuard([Permission.VIEW_PRODUCTS])],
  children: [
    {
      path: "create",
      canActivate: [permissionGuard([Permission.CREATE_PRODUCT])],
      loadComponent: () => import("./product-form").then(m => m.ProductForm),
    },
  ],
}
```

### Pattern 3: Resource-Based Access Control

```typescript
// shared/auth/guards/resource.guard.ts
export const resourceGuard = (resourceType: string, action: string): CanActivateFn => {
  return (route, state) => {
    const authService = inject(AuthService);
    const resourceService = inject(ResourceService);
    const router = inject(Router);

    const user = authService.getUser();
    const resourceId = route.paramMap.get("id");

    if (!user) {
      router.navigate(["/auth/login"]);
      return false;
    }

    // Check if user can access this specific resource
    const canAccess = resourceService.canAccess(user.id, resourceType, resourceId, action);

    if (!canAccess) {
      router.navigate(["/unauthorized"]);
      return false;
    }

    return true;
  };
};

// Usage in routes:
{
  path: "products/:id/edit",
  canActivate: [authGuard, resourceGuard("product", "edit")],
  loadComponent: () => import("./product-form").then(m => m.ProductForm),
}
```

### Pattern 4: Frontend + Backend Authorization

```typescript
// Frontend: Route guards (UI-level)
// These prevent users from seeing pages they shouldn't access

{
  path: "admin",
  canActivate: [authGuard, roleGuard(["admin"])],  // Frontend check
  loadChildren: () => import("./admin.routes").then(m => m.ADMIN_ROUTES),
}

// Backend: API guards (Data-level)
// These prevent users from accessing data they shouldn't access

// In NestJS controller:
@UseGuards(AuthGuard, RolesGuard)
@Roles("admin")
@Delete(":id")
async deleteProduct(@Param("id") id: string) {
  return this.productService.delete(id);
}

// The frontend guard is UX convenience
// The backend guard is security enforcement
// NEVER rely on frontend guards alone
```

---

## Comparison Matrix

### Complete Comparison Table

| Approach | Shared Angular | Runtime Loading | Independent Deploy | Router Integration | Auth Sharing | Multi-Framework | Complexity | Bundle Size | Best For |
|----------|:-------------:|:---------------:|:------------------:|:------------------:|:------------:|:---------------:|:----------:|:-----------:|----------|
| **Module Federation** | Yes | Yes | Yes | Yes | Remote URL | Angular + React | Medium | Small | Angular teams, runtime integration |
| **Native Federation** | Yes | Yes | Yes | Yes | Remote URL | Angular only | Medium | Small | New Angular projects |
| **Single-SPA** | No | Yes | Yes | Yes | localStorage | Any | High | Large | Multi-framework teams |
| **Web Components** | No | Yes | Yes | No | Custom Events | Any | Medium | Medium | Widget embedding |
| **Iframe** | No | Yes | Yes | No | postMessage | Any | Low | Large | Legacy integration |
| **Route-Based** | No | Yes | No | Yes | Import | Angular | Low | Large | Simple Angular apps |
| **npm Packages** | No | No | No | Yes | Import | Any | Low | Large | Component libraries |

### Score Card (1-5, higher is better)

| Approach | Ease of Setup | Runtime Flexibility | Independent Deploy | Auth Sharing | Multi-Framework | Overall Score |
|----------|:-------------:|:-------------------:|:------------------:|:------------:|:---------------:|:-------------:|
| Module Federation | 3 | 5 | 5 | 5 | 3 | **21** |
| Native Federation | 4 | 5 | 5 | 5 | 1 | **20** |
| Single-SPA | 2 | 5 | 5 | 3 | 5 | **20** |
| Web Components | 3 | 4 | 4 | 3 | 5 | **19** |
| Iframe | 5 | 4 | 4 | 2 | 5 | **20** |
| Route-Based | 4 | 3 | 2 | 4 | 2 | **15** |
| npm Packages | 5 | 1 | 1 | 4 | 3 | **14** |

---

## Decision Framework

### Step 1: Determine Your Constraints

Answer these questions:

1. **Do you need multiple frameworks?**
   - Yes → Single-SPA, Web Components, or Iframe
   - No → Module Federation, Native Federation, Route-Based, or npm Packages

2. **Do you need independent deployment?**
   - Yes → Module Federation, Native Federation, Single-SPA, Web Components, or Iframe
   - No → Route-Based or npm Packages

3. **Do you need shared Angular instance?**
   - Yes → Module Federation or Native Federation
   - No → Any approach

4. **Do you need Angular router integration?**
   - Yes → Module Federation, Native Federation, Single-SPA, Route-Based, or npm Packages
   - No → Web Components or Iframe

### Step 2: Match Constraints to Approaches

| Constraints | Recommended Approach |
|-------------|---------------------|
| Angular only + shared state + independent deploy | **Module Federation** or **Native Federation** |
| Multiple frameworks + independent deploy | **Single-SPA** |
| Widget embedding + no router | **Web Components** |
| Legacy integration + complete isolation | **Iframe** |
| Simple Angular app + no independent deploy | **Route-Based** or **npm Packages** |

### Step 3: Consider Your Team

| Team Size | Recommendation |
|-----------|----------------|
| 1-3 developers | Route-Based or npm Packages (simplest) |
| 4-10 developers | Module Federation or Native Federation |
| 10+ developers | Single-SPA (better orchestration at scale) |

### Step 4: Consider Your Timeline

| Timeline | Recommendation |
|----------|----------------|
| Quick prototype | Route-Based or Iframe (fastest setup) |
| Medium-term project | Module Federation or Native Federation |
| Long-term platform | Single-SPA or Module Federation |

---

## Migration Strategies

### Strategy 1: Monolith → Module Federation

```
Phase 1: Extract Auth
1. Create auth-app as standalone Angular app
2. Configure as Module Federation remote
3. Add loadRemoteModule to shell-app routes
4. Test authentication flow

Phase 2: Extract Admin
1. Create admin-app as standalone Angular app
2. Configure as Module Federation remote
3. Add loadRemoteModule to shell-app routes
4. Test admin functionality

Phase 3: Extract Features
1. Extract checkout, orders, etc. as separate apps
2. Configure each as Module Federation remote
3. Add routes in shell-app
4. Test full flow
```

### Strategy 2: Monolith → Single-SPA

```
Phase 1: Setup Orchestrator
1. Create orchestrator app with Single-SPA
2. Register shell-app as first microfrontend
3. Test basic routing

Phase 2: Extract Auth
1. Create auth-app with Single-SPA lifecycles
2. Register with orchestrator
3. Implement auth state sharing via localStorage
4. Test authentication flow

Phase 3: Extract Features
1. Extract other features as separate apps
2. Register each with orchestrator
3. Implement cross-app communication
4. Test full flow
```

### Strategy 3: Module Federation → Native Federation

```
Phase 1: Install Native Federation
1. npm add @angular-architects/native-federation
2. Run ng add for each app
3. Create federation.config.js files

Phase 2: Update Configurations
1. Update angular.json builders
2. Update webpack.config.js → federation.config.js
3. Update main.ts imports
4. Update app.config.ts providers

Phase 3: Test
1. Start all apps
2. Test remote loading
3. Verify shared dependencies
4. Test authentication flow
```

---

## Performance Considerations

### Bundle Size Comparison

| Approach | Shell App | Auth App | Total Initial Load |
|----------|-----------|----------|-------------------|
| Module Federation | 370 kB | 150 kB | 370 kB (auth lazy) |
| Native Federation | 350 kB | 140 kB | 350 kB (auth lazy) |
| Single-SPA | 370 kB | 370 kB | 740 kB (both load) |
| Web Components | 370 kB | 200 kB | 570 kB (both load) |
| Iframe | 370 kB | 370 kB | 740 kB (both load) |
| Route-Based | 520 kB | — | 520 kB (combined) |
| npm Packages | 520 kB | — | 520 kB (combined) |

### Lazy Loading Benefits

| Approach | Lazy Loading | First Load | Subsequent Loads |
|----------|:------------:|:----------:|:----------------:|
| Module Federation | Yes | Fast | Fast |
| Native Federation | Yes | Fast | Fast |
| Single-SPA | Yes | Medium | Fast |
| Web Components | No | Slow | Fast |
| Iframe | Yes | Medium | Fast |
| Route-Based | Yes | Fast | Fast |
| npm Packages | No | Slow | Fast |

### Caching Strategies

| Approach | Browser Cache | CDN Cache | Independent Updates |
|----------|:-------------:|:---------:|:-------------------:|
| Module Federation | Yes | Yes | Yes |
| Native Federation | Yes | Yes | Yes |
| Single-SPA | Yes | Yes | Yes |
| Web Components | Yes | Yes | Yes |
| Iframe | Yes | Yes | Yes |
| Route-Based | Yes | Yes | No |
| npm Packages | Yes | Yes | No |

---

## Security Considerations

### Token Security

| Concern | Solution |
|---------|----------|
| XSS attacks | Use HttpOnly cookies or secure localStorage |
| CSRF attacks | Use CSRF tokens in API requests |
| Token theft | Implement short-lived tokens + refresh |
| Man-in-the-middle | Use HTTPS in production |

### Origin Verification

```typescript
// Always verify message origin in iframe/postMessage communication
window.addEventListener("message", (event) => {
  // Verify origin
  const allowedOrigins = [
    "http://localhost:4200",
    "http://localhost:4201",
    "https://yourdomain.com",
  ];

  if (!allowedOrigins.includes(event.origin)) {
    console.warn("Invalid origin:", event.origin);
    return;
  }

  // Process message
});
```

### CORS Configuration

```typescript
// NestJS backend: Enable CORS for all frontend apps
app.enableCors({
  origin: [
    "http://localhost:4200",
    "http://localhost:4201",
    "http://localhost:4202",
    "https://shell.yourdomain.com",
    "https://auth.yourdomain.com",
    "https://admin.yourdomain.com",
  ],
  credentials: true,
});
```

### Content Security Policy

```html
<!-- index.html -->
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    script-src 'self' http://localhost:4201 http://localhost:4202;
    style-src 'self' 'unsafe-inline';
    connect-src 'self' http://localhost:3000 http://localhost:4201 http://localhost:4202;
  "
/>
```

---

## Troubleshooting

### Common Issues by Approach

#### Module Federation

| Issue | Cause | Solution |
|-------|-------|----------|
| Remote entry failed to load | Remote app not running | Start remote app first |
| Duplicate Angular instances | shareAll not configured | Add shareAll with singleton: true |
| Route not found | Remote name mismatch | Check webpack.config.js name field |
| CORS errors | Missing CORS headers | Add devServer headers to remote |

#### Native Federation

| Issue | Cause | Solution |
|-------|-------|----------|
| remoteEntry.json not found | Remote app not running | Start remote app first |
| Module not found | Version mismatch | Ensure same Angular versions |
| Build errors | Wrong builder | Use @angular-architects/native-federation |

#### Single-SPA

| Issue | Cause | Solution |
|-------|-------|----------|
| App not mounting | activeWhen rules wrong | Check URL patterns |
| App not unmounting | Missing unmount lifecycle | Implement unmount function |
| Duplicate Angular | No shared dependencies | Use System.import for shared deps |

#### Web Components

| Issue | Cause | Solution |
|-------|-------|----------|
| Custom element not defined | Not registered | Call customElements.define() |
| Styles not applied | Shadow DOM encapsulation | Use ::part or shared styles |
| Events not working | Wrong event type | Use CustomEvent with detail |

#### Iframe

| Issue | Cause | Solution |
|-------|-------|----------|
| postMessage not received | Wrong origin | Verify targetOrigin |
| Iframe not loading | CORS blocked | Add CORS headers to remote |
| Sizing issues | Fixed dimensions | Use responsive CSS |

---

## References

- [Angular-Architects Module Federation](https://angular-architects.io/learn/module-federation/)
- [Angular-Architects Native Federation](https://angular-architects.io/learn/native-federation/)
- [Single-SPA Documentation](https://single-spa.js.org/)
- [Angular Elements Guide](https://angular.dev/guide/elements)
- [Module Federation GitHub](https://github.com/module-federation/module-federation)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_components)
- [postMessage MDN](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage)

---

## Appendix: Quick Reference Cards

### Module Federation Quick Start

```bash
# 1. Install
npm add @angular-architects/module-federation

# 2. Create webpack.config.js (remote)
const { shareAll, withModuleFederationPlugin } = require("@angular-architects/module-federation/webpack");
module.exports = withModuleFederationPlugin({
  name: "auth",
  exposes: { "./routes": "./src/app/app.routes.ts" },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }) },
});

# 3. Create webpack.config.js (host)
module.exports = withModuleFederationPlugin({
  remotes: { auth: "http://localhost:4201/remoteEntry.js" },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }) },
});

# 4. Update angular.json (both apps)
"builder": "@angular-architects/module-federation"

# 5. Update app.config.ts (both apps)
import { provideModuleFederation } from "@angular-architects/module-federation";
providers: [..., provideModuleFederation()]

# 6. Update routes (host)
import { loadRemoteModule } from "@angular-architects/module-federation";
{ path: "auth", loadChildren: () => loadRemoteModule("auth", "./routes").then(m => m.routes) }
```

### Native Federation Quick Start

```bash
# 1. Install (remote)
npx ng add @angular-architects/native-federation --project auth-app --port 4201 --type remote

# 2. Install (host)
npx ng add @angular-architects/native-federation --project shell-app --port 4200 --type host

# 3. Create federation.config.js (remote)
const { shareAll, withNativeFederation } = require("@angular-architects/native-federation");
module.exports = withNativeFederation({
  name: "auth",
  exposes: { "./routes": "./src/app/app.routes.ts" },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }) },
});

# 4. Create federation.config.js (host)
module.exports = withNativeFederation({
  remotes: { auth: "http://localhost:4201/remoteEntry.json" },
  shared: { ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }) },
});

# 5. Update routes (host)
import { loadRemoteModule } from "@angular-architects/native-federation";
{ path: "auth", loadChildren: () => loadRemoteModule("auth", "./routes").then(m => m.routes) }
```

### Single-SPA Quick Start

```bash
# 1. Install (each app)
npm add single-spa single-spa-angular

# 2. Update main.ts (each app)
import { singleSpaAngular } from "single-spa-angular";
const lifecycles = singleSpaAngular({
  bootstrapModule: () => platformBrowserDynamic().bootstrapModule(App),
});
export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;

# 3. Register apps (orchestrator)
import { registerApplication } from "single-spa";
registerApplication({ name: "shell", app: () => System.import("@company/shell"), activeWhen: ["/"] });
registerApplication({ name: "auth", app: () => System.import("@company/auth"), activeWhen: ["/auth"] });
```

### Web Components Quick Start

```bash
# 1. Install (remote)
npm add @angular/elements

# 2. Create elements entry (remote)
import { createApplication } from "@angular/platform-browser";
import { MyComponent } from "./my.component";
const app = await createApplication();
customElements.define("my-component", createCustomElement(MyComponent, { injector: app.injector }));

# 3. Use in host
<my-component (onAction)="handleAction($event)"></my-component>
```

### Iframe Quick Start

```bash
# 1. Remote app: Just run normally
cd auth-app && npm start  # → http://localhost:4201

# 2. Host app: Embed iframe
<iframe src="http://localhost:4201/auth/login" style="width: 100%; height: 600px;"></iframe>

# 3. Communication via postMessage
// Remote: window.parent.postMessage({ type: "LOGIN", data: {...} }, "http://localhost:4200");
// Host: window.addEventListener("message", (e) => { if (e.origin === "http://localhost:4201") {...} });
```

### Route-Based Quick Start

```bash
# 1. Create shared routes file
export const AUTH_ROUTES: Routes = [
  { path: "login", loadComponent: () => import("./login").then(m => m.Login) },
  { path: "register", loadComponent: () => import("./register").then(m => m.Register) },
];

# 2. Import in each app
import { AUTH_ROUTES } from "./shared/auth/auth.routes";
{ path: "auth", children: AUTH_ROUTES }
```

### npm Package Quick Start

```bash
# 1. Publish auth-app
ng build
npm publish --access public

# 2. Install in each app
npm add @company/auth-app

# 3. Import routes
import { AUTH_ROUTES } from "@company/auth-app";
{ path: "auth", children: AUTH_ROUTES }
```

---

**End of Document**
