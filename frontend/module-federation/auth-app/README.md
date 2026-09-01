# Auth App — Module Federation Remote

This is the **authentication microfrontend** for CommerceOS. It runs as a **standalone Angular app** and also as a **Module Federation remote** that the shell-app loads at runtime.

**Port:** `4201`
**Backend API:** `http://localhost:3000/api/v1`

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Current State](#current-state)
- [Module Federation Setup](#module-federation-setup)
- [File Changes Required](#file-changes-required)
- [Running the App](#running-the-app)
- [Testing Module Federation](#testing-module-federation)
- [Available Routes](#available-routes)
- [Project Structure](#project-structure)
- [Troubleshooting](#troubleshooting)

---

## Overview

This app serves two purposes:

1. **Standalone app** — Can be run independently at `http://localhost:4201` for development
2. **MF Remote** — Exposes its routes to the shell-app, which loads them at `http://localhost:4200/auth/*`

When the shell-app navigates to `/auth/login`, it fetches this app's code via Module Federation and renders the login form inside the shell-app's layout (header + footer).

---

## Features

- Login with email + password
- Register with validation (first name, last name, email, phone, password)
- Password visibility toggle
- Real-time password strength hints
- Forgot password flow
- Reset password via token
- Email verification (auto-verify from URL token)
- Resend verification email
- Post-login dashboard with user info + logout
- JWT access + refresh token storage
- HTTP interceptor for Bearer token injection
- Route guards (`authGuard`, `guestGuard`)
- Signal-based auth state management

---

## Current State

The app currently uses the **default Angular CLI builder** (`@angular/build:application`). Module Federation is **not yet configured**. The sections below describe the exact changes needed.

### Current Files

| File | Current State |
|------|---------------|
| `angular.json` | Uses `@angular/build:application` builder |
| `src/main.ts` | Standard bootstrap — no MF |
| `src/app/app.config.ts` | No `provideModuleFederation()` |
| `src/app/app.routes.ts` | Standard routes — no MF exports |
| `package.json` | No `@angular-architects/module-federation` |
| `webpack.config.js` | Does not exist |

---

## Module Federation Setup

### Step 1: Install Module Federation Package

```bash
cd auth-app
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
    "port": 4201,
    "publicHost": "http://localhost:4201"
  },
  "configurations": {
    "production": {
      "buildTarget": "auth-app:build:production"
    },
    "development": {
      "buildTarget": "auth-app:build:development"
    }
  },
  "defaultConfiguration": "development"
}
```

### Step 3: Create `webpack.config.js`

Create a new file at `auth-app/webpack.config.js`:

```javascript
const {
  shareAll,
  withModuleFederationPlugin,
} = require("@angular-architects/module-federation/webpack");

module.exports = withModuleFederationPlugin({
  // Remote name — the shell-app uses this name to reference this app
  name: "auth",

  // Modules exposed to the host (shell-app)
  exposes: {
    // Expose the routes module so the shell-app can lazy-load auth routes
    "./routes": "./src/app/app.routes.ts",
  },

  // Share dependencies to avoid duplicate instances
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
- `name: "auth"` — Registers this remote as `auth` in the Module Federation runtime
- `exposes: { "./routes": "..." }` — Makes the routes file available for the shell-app to import
- `shareAll(...)` — Automatically shares all `package.json` dependencies as singletons (Angular, RxJS, etc.)

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

// For remote mode — bootstrap normally
// The shell-app's router will mount this app's routes via loadRemoteModule
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
import { authInterceptor } from './core/interceptors/auth.interceptor';

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

### Step 6: Verify `src/app/app.routes.ts` Exports

The routes file is already properly structured. The shell-app will import `routes` from this file via Module Federation.

**Current** (`src/app/app.routes.ts`):
```typescript
import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/auth-layout/auth-layout';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('./features/auth/login/login').then((m) => m.Login), title: 'Sign In' },
      { path: 'register', loadComponent: () => import('./features/auth/register/register').then((m) => m.Register), title: 'Create Account' },
      { path: 'forgot-password', loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword), title: 'Forgot Password' },
      { path: 'reset-password', loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword), title: 'Reset Password' },
      { path: 'verify-email', loadComponent: () => import('./features/auth/verify-email/verify-email').then((m) => m.VerifyEmail), title: 'Verify Email' },
      { path: 'resend-verification', loadComponent: () => import('./features/auth/resend-verification/resend-verification').then((m) => m.ResendVerification), title: 'Resend Verification' },
    ],
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
    title: 'Dashboard',
  },
  { path: '**', redirectTo: '' },
];
```

No changes needed — this file exports `routes` which the webpack config references as `"./routes"`.

---

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Edit | Add `@angular-architects/module-federation` |
| `angular.json` | Edit | Switch builders to `@angular-architects/module-federation` |
| `webpack.config.js` | **Create** | MF remote configuration with `name: "auth"` and `exposes` |
| `src/main.ts` | Edit | Import `loadManifest` for MF compatibility |
| `src/app/app.config.ts` | Edit | Add `provideModuleFederation()` provider |
| `src/app/app.routes.ts` | No change | Already exports `routes` correctly |

---

## Running the App

### As Standalone (Development)

```bash
cd auth-app
npm start
# → http://localhost:4201
```

The app runs independently. You can test all auth pages directly.

### As MF Remote (for shell-app consumption)

```bash
# Start auth-app FIRST (remote must be running before the host)
cd auth-app
npm start
# → http://localhost:4201
# → Remote entry available at http://localhost:4201/remoteEntry.js

# Then start shell-app
cd shell-app
npm start
# → http://localhost:4200
# → Navigate to http://localhost:4200/auth/login
```

### Verify Remote Entry

After starting the auth-app, verify the remote entry is accessible:

```bash
curl http://localhost:4201/remoteEntry.js
# Should return JavaScript code (the Module Federation entry point)
```

---

## Testing Module Federation

1. Start both apps (auth-app first, then shell-app)
2. Open http://localhost:4200 (shell-app)
3. Click "Sign in" in the header
4. The URL should change to `http://localhost:4200/auth/login`
5. The login form should render inside the shell-app's layout (header + footer visible)
6. The login form code was loaded from auth-app (port 4201) at runtime

### What Happens at Runtime

```
1. User clicks "Sign in" in shell-app header
2. Angular router navigates to /auth/login
3. Route config triggers: loadRemoteModule('auth', './routes')
4. Module Federation fetches http://localhost:4201/remoteEntry.js
5. Auth-app's routes, components, and styles are loaded into shell-app
6. The login form renders inside the shell-app's ShellComponent layout
7. All HTTP requests go to the same backend API
8. JWT tokens are stored in localStorage (shared between both apps)
```

---

## Available Routes

| Path | Component | Guard | Description |
|------|-----------|-------|-------------|
| `/auth` | — | `guestGuard` | Redirects to `/auth/login` |
| `/auth/login` | `Login` | `guestGuard` | User sign in |
| `/auth/register` | `Register` | `guestGuard` | Create account |
| `/auth/forgot-password` | `ForgotPassword` | `guestGuard` | Request password reset |
| `/auth/reset-password` | `ResetPassword` | `guestGuard` | Set new password (via `?token=`) |
| `/auth/verify-email` | `VerifyEmail` | `guestGuard` | Auto-verify from URL token |
| `/auth/resend-verification` | `ResendVerification` | `guestGuard` | Resend verification link |
| `/auth/dashboard` | `Dashboard` | `authGuard` | Post-login dashboard |

---

## Project Structure

```
auth-app/
├── src/
│   ├── app/
│   │   ├── core/
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts          # authGuard + guestGuard
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts    # Bearer token injection
│   │   │   ├── models/
│   │   │   │   └── auth.model.ts          # Auth-specific interfaces
│   │   │   └── services/
│   │   │       └── auth.ts                # AuthService (signal-based)
│   │   │
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── auth-layout/
│   │   │   │   │   └── auth-layout.ts     # Centered card wrapper
│   │   │   │   ├── login/
│   │   │   │   │   └── login.ts           # Login form component
│   │   │   │   ├── register/
│   │   │   │   │   └── register.ts        # Registration form
│   │   │   │   ├── forgot-password/
│   │   │   │   │   └── forgot-password.ts
│   │   │   │   ├── reset-password/
│   │   │   │   │   └── reset-password.ts
│   │   │   │   ├── verify-email/
│   │   │   │   │   └── verify-email.ts
│   │   │   │   └── resend-verification/
│   │   │   │       └── resend-verification.ts
│   │   │   └── dashboard/
│   │   │       └── dashboard.ts           # Post-login page
│   │   │
│   │   ├── app.ts                         # Root component
│   │   ├── app.html
│   │   ├── app.routes.ts                  # Routes (exposed via MF)
│   │   └── app.config.ts                  # Providers (with MF)
│   │
│   ├── environments/
│   │   └── environment.ts                 # API base URL
│   ├── styles.css                         # Auth-specific styles
│   ├── index.html
│   └── main.ts                            # Bootstrap (with MF)
│
├── angular.json                           # MF builder config
├── package.json                           # @angular-architects/module-federation
├── tsconfig.json
├── tsconfig.app.json
└── webpack.config.js                      # MF remote configuration (CREATE THIS)
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

This means when the shell-app loads this remote, both apps use the same Angular instance — no duplicate code.

---

## Troubleshooting

### 1. "Remote entry failed to load"

**Cause:** App not running or wrong port.

```bash
# Verify the app is running
curl http://localhost:4201/remoteEntry.js

# If not running
npm start
```

### 2. CORS errors in browser console

**Cause:** Shell-app (port 4200) trying to fetch from auth-app (port 4201).

**Fix:** Add CORS headers to webpack dev server. Update `webpack.config.js`:

```javascript
module.exports = withModuleFederationPlugin({
  name: "auth",
  exposes: {
    "./routes": "./src/app/app.routes.ts",
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
  },
  devServer: {
    headers: {
      "Access-Control-Allow-Origin": "*",
    },
  },
});
```

### 3. "Cannot find module" errors

**Cause:** Version mismatch between shell-app and auth-app.

```bash
# Check Angular versions match
npm ls @angular/core
# Both apps should have the same version
```

### 4. Duplicate Angular instances

**Cause:** `shareAll()` not configured or `singleton: false`.

**Fix:** Ensure `webpack.config.js` has:
```javascript
shared: {
  ...shareAll({ singleton: true, strictVersion: true, requiredVersion: "auto" }),
}
```

### 5. Routes not found at /auth/login

**Cause:** Remote name mismatch or routes not exported.

**Fix:**
1. Check `webpack.config.js` has `name: "auth"`
2. Check `exposes` includes `"./routes": "./src/app/app.routes.ts"`
3. Check `app.routes.ts` exports `routes` (not a default export)

### 6. HMR not working

**Expected:** Module Federation has limited HMR support. After code changes:
1. Restart this app's dev server
2. Hard refresh the shell-app (Ctrl+Shift+R)

---

## API Endpoints Used

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/auth/register` | Register new account |
| `POST` | `/api/v1/auth/login` | Login (returns JWT tokens) |
| `POST` | `/api/v1/auth/refresh` | Refresh access token |
| `POST` | `/api/v1/auth/logout` | Revoke refresh token |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset |
| `POST` | `/api/v1/auth/reset-password` | Reset password with token |
| `POST` | `/api/v1/auth/verify-email` | Verify email with token |
| `GET` | `/api/v1/auth/me` | Get current user (requires Bearer token) |

---

## Next Steps

After Module Federation is configured:
1. Test standalone mode — verify all auth pages work independently
2. Test remote mode — verify auth pages load inside the shell-app
3. Add more exposed modules (e.g., `"./components"` for shared auth components)
4. Set up production deployment with proper remote entry URLs
