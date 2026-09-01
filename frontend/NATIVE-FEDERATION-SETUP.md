# Native Federation Microfrontend Guide

This guide documents the correct Native Federation setup for the Angular apps in this repo and expands it into a beginner-friendly architecture guide for same-framework and cross-framework microfrontends.

```text
frontend/native-federation/
  shell-app/   # host storefront, port 4200
  auth-app/    # remote auth app, port 4201
  admin-app/   # remote admin app, port 4202
```

The project uses `@angular-architects/native-federation` with Angular's esbuild application builder. Native Federation is not webpack module federation; the remote entry is `remoteEntry.json`, and runtime package resolution depends on an import map created before Angular is bootstrapped.

> **v3 vs v4 note.** Starting at Angular 22, Native Federation moved to a "v4" rework (new org: `github.com/native-federation`; runtime split into `@softarc/native-federation-orchestrator` + `@softarc/native-federation-runtime`). On Angular 22, the Angular adapter package reverts to its plain name, `@angular-architects/native-federation` (no `-v4` suffix). The config file syntax used throughout this guide — `federation.config.mjs` with `import`/`export default` — is already the v4 shape; no changes needed there. What *does* change under v4 is the runtime loading API: `loadRemoteModule` imported directly from `@angular-architects/native-federation` still works but is **deprecated** — it resolves against a module-scoped federation instance rather than the one your `initFederation()` call actually created. This repo uses the `federation-loader.ts` wrapper pattern (see [Bootstrap Pattern](#bootstrap-pattern)) instead, which is the currently recommended approach.

Terminology used in this document:

| Term | Meaning |
| --- | --- |
| Shell / Host | The main application that loads remotes. In this repo: `shell-app`. |
| Remote | A separately built microfrontend loaded by the shell. In this repo: `auth-app`, `admin-app`. |
| Microfrontend / MFE | A frontend feature application with its own build and deployment. |
| Native Federation | ESM/import-map based federation for loading remote modules at runtime. |
| Shared Dependency | A package, such as Angular or RxJS, resolved once and reused where possible. |
| Communication Contract | A stable event, callback, route, API, or type that apps agree to use. |
| Shared State | Small state intentionally shared across MFEs, such as user summary or theme. |
| Design Tokens | CSS variables for shared colors, spacing, radius, typography, and shadows. |

## Table of Contents

- [What Native Federation Is](#what-native-federation-is)
- [Why Microfrontends](#why-microfrontends)
- [Versions](#versions)
- [Native Federation Architecture](#native-federation-architecture)
- [Application Roles](#application-roles)
- [Same-Framework Native Federation](#same-framework-native-federation)
- [Cross-Framework Native Federation](#cross-framework-native-federation)
- [Native Federation Vs Module Federation](#native-federation-vs-module-federation)
- [Install Package](#install-package)
- [Generate Native Federation Config](#generate-native-federation-config)
- [Angular Builder](#angular-builder)
- [Bootstrap Pattern](#bootstrap-pattern)
- [Federation Configs](#federation-configs)
- [Federation Manifests](#federation-manifests)
- [Routing](#routing)
- [Communication Between Shell And Remotes](#communication-between-shell-and-remotes)
- [Authentication And Session Communication](#authentication-and-session-communication)
- [Shared Theme And Design System](#shared-theme-and-design-system)
- [Theme Colors](#theme-colors)
- [Start And Test Locally](#start-and-test-locally)
- [Build](#build)
- [Production](#production)
- [Environment Configuration](#environment-configuration)
- [Shared Dependencies](#shared-dependencies)
- [Remote Loading Error Handling](#remote-loading-error-handling)
- [Security](#security)
- [CORS Vs Federation](#cors-vs-federation)
- [Versioning And Contracts](#versioning-and-contracts)
- [Independent Deployment](#independent-deployment)
- [Recommended Project Structure](#recommended-project-structure)
- [Production Architecture](#production-architecture)
- [Testing](#testing)
- [Decision Guide](#decision-guide)
- [Anti-Patterns](#anti-patterns)
- [Troubleshooting](#troubleshooting)
- [Recommended Learning Order](#recommended-learning-order)
- [Complete Example Architecture](#complete-example-architecture)
- [Final Architecture Rules](#final-architecture-rules)
- [Checklist](#checklist)

## What Native Federation Is

Native Federation is a way to load separately built frontend modules at runtime using browser-native ESM concepts and import maps.

```text
Native Federation
       |
       |-- Runtime module loading
       |-- Remote discovery
       |-- Shared dependencies
       |-- Independent deployment
       `-- Module exposure/import
```

In this repo, `shell-app` does not bundle all of `auth-app` and `admin-app` into its own JavaScript output. Instead, the shell reads each remote's `remoteEntry.json`, prepares an import map, and loads exposed modules when a route needs them.

Native Federation solves this problem:

```text
How can one frontend app load code from another independently built frontend app?
```

Native Federation does not automatically solve these problems:

```text
Authentication
Authorization
Shared application state
Communication contracts
Global event management
Shared design system
Business data synchronization
Backend security
Cross-MFE business rules
```

Federation composes frontend modules. Application communication, authentication, state, design tokens, and business rules still need architecture.

## Why Microfrontends

A Microfrontend architecture splits one large frontend into smaller frontend applications.

```text
E-commerce Application
|
|-- Products
|-- Users
|-- Orders
|-- Payments
`-- Admin
```

Instead of one frontend build owning everything, each feature can become a separately built app:

```text
Shell / Host
|
|-- Auth Remote
|-- Admin Remote
|-- Products Remote
`-- Orders Remote
```

Use microfrontends when independent ownership and deployment matter. Do not use them only to organize folders. A normal Angular workspace with libraries is simpler when one team owns one deployable application.

## Versions

This repo currently targets Angular 22.

Node version requirements shift as the Angular CLI evolves, so treat any hardcoded list as a starting point rather than a guarantee — confirm against the actually installed CLI:

```bash
npx ng version
```

Node `v24.13.0` and older patch releases are known to be too old for recent Angular CLI majors and will fail before the app builds. Use a current LTS or newer Node release and let `ng version` tell you if it's insufficient.

## Native Federation Architecture

```text
                                      +---------------------+
                                      |      Backend API    |
                                      |     Auth / Data     |
                                      +----------+----------+
                                                 |
                         +-----------------------v-----------------------+
                         |                  SHELL / HOST                 |
                         |                    Angular                    |
                         |                                               |
                         |  Navigation Router | Auth State | Theme Tokens |
                         +---------------+--------------+----------------+
                                         |              |
                         +---------------+              +--------------+
                         |                                             |
                         v                                             v
                +-------------------+                         +-------------------+
                | Angular Remote    |                         | React Remote      |
                | Products          |                         | Reports           |
                +-------------------+                         +-------------------+
                         |                                             |
                         v                                             v
                +-------------------+                         +-------------------+
                | Angular Remote    |                         | Vue Remote        |
                | Admin             |                         | Analytics         |
                +-------------------+                         +-------------------+
```

Remote names must match everywhere:

| App | Federation name | Remote entry |
| --- | --- | --- |
| `auth-app` | `auth_app` | `http://localhost:4201/remoteEntry.json` |
| `admin-app` | `admin_app` | `http://localhost:4202/remoteEntry.json` |

Runtime flow in this repo:

```text
1. Browser opens http://localhost:4200.
2. shell-app initializes Native Federation with /assets/federation.manifest.json.
3. Native Federation reads remoteEntry.json files for auth_app and admin_app.
4. User navigates to /auth/login or /admin/dashboard.
5. Angular router calls the Shell's loadRemote(...) wrapper.
6. The remote routes are loaded and rendered inside the shell document.
```

## Application Roles

An application can have one of three practical roles in Native Federation.

| Role | What it does | Needs `exposes`? | Needs `remotes`? | Needs manifest in `initFederation(...)`? |
| --- | --- | --- | --- | --- |
| Host only | Loads other apps, but is not loaded by another app. | Usually no | Yes | Yes |
| Remote only | Is loaded by a Host, but does not load other apps. | Yes | No | No |
| Host+Remote | Is loaded by a Host and also loads another Remote. | Yes | Yes | Yes |

In this project:

| App | Role | Why |
| --- | --- | --- |
| `shell-app` | Host only | It loads `auth-app` and `admin-app`. It is the main entry point for users. |
| `auth-app` | Remote only | It exposes auth routes to other apps. It does not load another remote. |
| `admin-app` | Host+Remote | It is loaded by `shell-app`, and it can also load `auth-app` for admin login routes. |

The important beginner rule:

```text
Every Angular Native Federation app calls initFederation before bootstrap.

Remote only:
  initFederation()

Host only or Host+Remote:
  initFederation('/assets/federation.manifest.json')
```

Why:

| App type | Why it initializes federation |
| --- | --- |
| Remote only | It still needs Native Federation setup before Angular bootstrap so its exposed modules and shared dependencies are prepared correctly. |
| Host only | It needs to read a manifest so it can discover and load Remotes. |
| Host+Remote | It needs both: expose its own modules and discover Remotes it consumes. |

## Same-Framework Native Federation

The simplest setup is Angular to Angular:

```text
Angular Shell
      |
      |-- Angular Auth Remote
      |-- Angular Admin Remote
      |-- Angular Products Remote
      `-- Angular Orders Remote
```

This is the easiest architecture because every app uses the same framework runtime, router model, dependency injection model, build style, and CSS strategy.

In Angular-to-Angular Native Federation:

- Share Angular runtime packages as singletons.
- Share `rxjs` when Angular services/events depend on it.
- Lazy-load remote routes from the shell.
- Keep each remote's internal routes and feature code inside that remote.
- Use shared services only for stable, intentionally shared platform concerns.

This repo is an Angular-to-Angular example:

```text
shell-app  http://localhost:4200
  loads auth_app  from http://localhost:4201/remoteEntry.json
  loads admin_app from http://localhost:4202/remoteEntry.json

auth-app   http://localhost:4201
  exposes ./routes from ./src/app/app.routes.ts

admin-app  http://localhost:4202
  exposes ./routes from ./src/app/app.routes.ts
  can also load auth_app for admin login routes
```

## Cross-Framework Native Federation

Native Federation can participate in cross-framework architectures, but framework interoperability must be designed explicitly.

```text
                     Angular Shell
                          |
          +---------------+----------------+
          |               |                |
          v               v                v
    Angular MFE       React MFE         Vue MFE
      Products         Reports          Analytics
```

Cross-framework MFEs can be useful for:

- Existing teams using different frameworks.
- Gradual migration.
- Legacy application integration.
- Independent technology choices.

They also cost more:

- More runtime concepts.
- Different lifecycle models.
- More complex communication.
- More difficult shared UI.
- More testing and deployment combinations.

Do not choose Angular + React + Vue just because federation makes it possible.

Recommended cross-framework boundary:

```text
Angular Shell
      |
      |-- Router / URL
      |-- Custom Events
      |-- Web Components
      |-- Shared API Contracts
      `-- Backend APIs
             |
             |-- Angular
             |-- React
             `-- Vue
```

Bad boundary:

```text
Shell
  |
  v
React-specific API
  |
  v
React Remote
```

Better boundary:

```text
Shell
  |
  v
Framework-neutral contract
  |
  v
Remote
```

### Angular Shell Loading A React Remote

Do not pretend a React component is an Angular component. Use a stable boundary, usually a Web Component.

```text
Angular Shell
      |
      v
<reports-widget>
      |
      v
React Reports Remote
```

The React remote exposes a registration module that defines a custom element. The Angular shell loads the module and uses the element.

```ts
// shell-app/src/app/shared/reports-widget-loader.ts
import { loadRemote } from '@federation-loader';

export async function registerReportsWidget(): Promise<void> {
    await loadRemote('reports_app', './register');
}
```

This helper belongs behind an Angular wrapper component lifecycle, not as top-level route code. The wrapper loads the remote registration module, then renders the custom element after it is registered.

```html
<!-- Angular template after the element has been registered -->
<reports-widget user-id="123"></reports-widget>
```

Communication should use properties, attributes, and `CustomEvent`:

```ts
document.querySelector('reports-widget')?.addEventListener('report:selected', (event) => {
    const selected = event as CustomEvent<{ reportId: string }>;
    console.log(selected.detail.reportId);
});
```

### Angular Shell Loading A Vue Remote

Use the same browser-level boundary:

```text
Angular Shell
      |
      v
<analytics-widget>
      |
      v
Vue Analytics Remote
```

Angular should not reach into Vue internals. Pass small inputs through attributes/properties and receive events through `CustomEvent`.

```html
<analytics-widget tenant-id="store-1"></analytics-widget>
```

```ts
window.addEventListener('analytics:filter-changed', (event) => {
    const filterEvent = event as CustomEvent<{ range: string }>;
    console.log(filterEvent.detail.range);
});
```

### React Or Vue Shell Loading Angular

The practical boundary is also a Web Component. Package the Angular remote feature as a custom element, register it through a federated module, and let React/Vue render the custom element tag.

```text
React/Vue Shell
      |
      v
<admin-widget>
      |
      v
Angular Admin Remote
```

For React/Vue to Angular, the same rule applies. A React or Vue Shell should not call Angular component internals directly. Expose an Angular Custom Element or a small mount API from the Angular Remote, then communicate through properties, events, URLs, and backend APIs.

## Native Federation Vs Module Federation

Native Federation and Module Federation both help compose independently built frontend applications, but they are not the same implementation.

| Feature | Native Federation | Module Federation |
| --- | --- | --- |
| Main idea | Load ESM-based remote modules through federation metadata and import maps. | Load federated modules using the Module Federation runtime model originally popularized by webpack. |
| Remote entry in this Angular setup | `remoteEntry.json` | Often `remoteEntry.js`, depending on implementation. |
| Webpack dependency | Designed to avoid depending on webpack for Angular federation. | Commonly associated with webpack, but there are modern non-webpack implementations too. |
| Angular fit | Works well with Angular's esbuild/application builder through `@angular-architects/native-federation`. | Works in Angular too, but configuration depends on the selected federation library and builder. |
| Vite fit | Native Federation is focused on browser-native ESM/import-map style loading. | Vite federation requires a Vite-compatible federation plugin/runtime. |
| Shared dependencies | Uses configured shared packages and import-map based resolution. | Uses the selected Module Federation runtime's shared dependency mechanism. |
| Mixed frameworks | Possible, but framework interoperability still needs Web Components, mount APIs, events, URLs, or backend APIs. | Also possible, with the same framework-boundary concerns. |
| Ecosystem | Strong Angular-specific tooling from `@angular-architects/native-federation`. | Broad ecosystem, especially for webpack-based microfrontends. |
| Complexity | Lower for modern Angular-to-Angular Native Federation projects. | Depends heavily on bundler, runtime, and framework choices. |

Choose Native Federation when your Angular project uses the Angular application builder and you want the `@angular-architects/native-federation` approach used in this repo.

Choose Module Federation when your project has already standardized on a Module Federation runtime or you need compatibility with an existing webpack/module-federation architecture.

Do not mix Native Federation config examples with Vite Module Federation config examples. The package names, remote entry format, and runtime setup are different.

## Install Package

Run this in each Angular app directory:

```bash
cd frontend/native-federation/auth-app
npm add @angular-architects/native-federation es-module-shims

cd ../admin-app
npm add @angular-architects/native-federation es-module-shims

cd ../shell-app
npm add @angular-architects/native-federation es-module-shims
```

On Angular 22, `@angular-architects/native-federation` is the v4-generation package under its plain name — do not install the `-v4` suffixed package unless you are on Angular 20/21 and backporting.

## Generate Native Federation Config

Use the schematic per app. The exact CLI options can vary by package version, but the intended roles are:

| App | Role | Generator type |
| --- | --- | --- |
| `shell-app` | Host only | `dynamic-host` |
| `auth-app` | Remote only | `remote` |
| `admin-app` | Host+Remote | Start with `remote`, then add `remotes` and a manifest because it also loads `auth-app`. |

```bash
cd frontend/native-federation/auth-app
npx ng add @angular-architects/native-federation --project auth-app --port 4201 --type remote

cd ../admin-app
npx ng add @angular-architects/native-federation --project admin-app --port 4202 --type remote

cd ../shell-app
npx ng add @angular-architects/native-federation --project shell-app --port 4200 --type dynamic-host
```

After generation, verify the files against the sections below. Prefer the generated builder shape for the installed version, but keep the bootstrap and remote-name rules from this document.

For a Host+Remote such as `admin-app`, the generator creates only the starting point. The app needs both sides of the configuration:

```text
admin-app exposes ./routes so shell-app can load it.
admin-app also configures auth_app as a remote so admin-app can load auth-app.
```

## Angular Builder

Each app should have a Native Federation wrapper target and a normal esbuild target.

Example shape from this repo:

```json
{
  "architect": {
    "build": {
      "builder": "@angular-architects/native-federation:build",
      "options": {
        "cacheExternalArtifacts": true,
        "tsConfig": "tsconfig.app.json"
      },
      "configurations": {
        "production": {
          "target": "app-name:esbuild:production"
        },
        "development": {
          "target": "app-name:esbuild:development",
          "dev": true
        }
      }
    },
    "serve": {
      "builder": "@angular-architects/native-federation:build",
      "options": {
        "target": "app-name:serve-original:development",
        "tsConfig": "tsconfig.app.json",
        "rebuildDelay": 500,
        "cacheExternalArtifacts": true,
        "dev": true,
        "devServer": true,
        "port": 0
      }
    },
    "esbuild": {
      "builder": "@angular/build:application",
      "options": {
        "browser": "src/main.ts",
        "tsConfig": "tsconfig.app.json",
        "polyfills": ["es-module-shims"]
      }
    },
    "serve-original": {
      "builder": "@angular/build:dev-server",
      "options": {
        "port": 4200
      }
    }
  }
}
```

> Point `tsConfig` at the same file where you define the `@federation-loader` path alias (see [Bootstrap Pattern](#bootstrap-pattern)) — typically `tsconfig.app.json`. If your federation build target points at a separate `tsconfig.federation.json` that doesn't include your `paths` mapping, the alias will fail to resolve during that build even though it resolves fine in the editor.

Set `serve-original.options.port` to the app's actual port:

| App | Port |
| --- | --- |
| `shell-app` | `4200` |
| `auth-app` | `4201` |
| `admin-app` | `4202` |

## Bootstrap Pattern

Do not statically import Angular bootstrap code in `main.ts`.

Native Federation must initialize before Angular packages such as `@angular/platform-browser`, `@angular/core`, and `@angular/router` are imported by the browser. Otherwise the browser can fail with:

```text
Unable to resolve specifier '@angular/platform-browser'
Unable to resolve specifier '@angular/core'
```

Use this split instead.

### Host Only And Host+Remote Apps

Use this for `shell-app` and `admin-app`, because both load remote apps from a manifest:

```ts
// src/main.ts
import { startFederation } from './federation-loader';

startFederation('/assets/federation.manifest.json')
    .then(() => import('./bootstrap'))
    .catch((err: unknown) => console.error(err));
```

Create a small loader helper in host apps. Place it at `src/federation-loader.ts`, next to `main.ts`, in **every** app that acts as a Host or Host+Remote (`shell-app` and `admin-app` in this repo — `auth-app` never loads a remote, so it doesn't need one):

```text
shell-app/
  src/
    main.ts
    federation-loader.ts   <- one per host app
    bootstrap.ts
    app/
      app.routes.ts        <- imports '@federation-loader'

admin-app/
  src/
    main.ts
    federation-loader.ts   <- own copy; admin loads auth_app
    bootstrap.ts
    app/
      app.routes.ts        <- imports '@federation-loader'

auth-app/
  src/
    main.ts                 <- plain initFederation(), no manifest, no loader file
    bootstrap.ts
    app/
      app.routes.ts          <- exports `routes`, no loadRemote needed
```

This is intentionally per-app, not shared library code — each app has its own federation runtime instance and its own manifest, so the module-level `federation` promise in the loader needs to stay scoped to that app's bundle. Duplicating this small file per app is correct, not a DRY violation.

```ts
// src/federation-loader.ts
//
// Place this file at `src/federation-loader.ts` in every app that acts as a
// Host or Host+Remote (shell-app, admin-app). auth-app is Remote-only and
// never loads another remote, so it doesn't need this file.
//
// This wraps @angular-architects/native-federation's initFederation() and
// exposes a typed loadRemote() helper that resolves loadRemoteModule off the
// actual runtime instance your app started — NOT the deprecated top-level
// loadRemoteModule export, which resolves against a separate module-scoped
// instance and is kept only for backwards compatibility on v4.

import {
    initFederation,
    type NativeFederationResult,
} from '@angular-architects/native-federation';

let federation: Promise<NativeFederationResult> | undefined;

/**
 * Starts Native Federation for this app.
 *
 * Call this once, at the very top of main.ts, before any Angular import.
 *
 * @param manifestUrl - Path to this app's federation manifest
 *   (e.g. '/assets/federation.manifest.json'). Omit for a pure Remote
 *   that never loads another remote (e.g. auth-app).
 * @param options - Optional runtime options. `{ sse: true }` enables
 *   automatic shell reload in dev when a remote finishes rebuilding.
 */
export function startFederation(
    manifestUrl?: string,
    options?: { sse?: boolean }
): Promise<NativeFederationResult> {
    federation = initFederation(manifestUrl, options);
    return federation;
}

/**
 * Loads an exposed module from a remote, using the federation instance
 * this app actually started with startFederation().
 *
 * @param remoteName - Must match the `name` in the remote's
 *   federation.config.mjs AND the key in this app's federation manifest.
 * @param exposedModule - Must match a key under `exposes` in the
 *   remote's federation.config.mjs (e.g. './routes').
 *
 * @throws if called before startFederation() has run.
 *
 * @example
 * loadRemote<{ routes: Routes }>('auth_app', './routes').then((m) => m.routes)
 */
export async function loadRemote<T = unknown>(
    remoteName: string,
    exposedModule: string
): Promise<T> {
    if (!federation) {
        throw new Error(
            'Native Federation has not been initialized. Call startFederation() in main.ts before using loadRemote().'
        );
    }

    const { loadRemoteModule } = await federation;
    return loadRemoteModule<T>(remoteName, exposedModule);
}
```

Why this helper exists:

```text
initFederation(...)
  |
  v
returns the current Native Federation runtime
  |
  v
use runtime.loadRemoteModule(...) from routes/components
```

The installed package still exposes a top-level `loadRemoteModule` you can import directly from `@angular-architects/native-federation`, but it is **deprecated** on v4 — it resolves against a separate module-scoped instance rather than the one your `startFederation()` call created. Always import `loadRemote` from your local `federation-loader.ts` in route files, never `loadRemoteModule` directly.

Optional: v4 supports automatic shell reload when a remote finishes rebuilding in dev, via an `sse` flag:

```ts
startFederation('/assets/federation.manifest.json', { sse: true })
    .then(() => import('./bootstrap'))
    .catch((err: unknown) => console.error(err));
```

This eliminates manual browser refreshes while iterating on a remote locally.

#### Resolving the `@federation-loader` import

Route files at different nesting depths (`app/app.routes.ts` vs. `app/features/auth/auth.routes.ts`) shouldn't need to count `../` segments to find the loader. Add a path alias per app instead:

```json
// tsconfig.app.json (the same tsConfig your esbuild/federation build targets point to)
{
  "compilerOptions": {
    "paths": {
      "@federation-loader": ["src/federation-loader.ts"]
    }
  }
}
```

```ts
// works from any depth
import { loadRemote } from '@federation-loader';
```

### Remote Only App

Use this for `auth-app`, because it exposes routes but does not need to load another remote:

```ts
// src/main.ts
import { initFederation } from '@angular-architects/native-federation';

initFederation()
    .then(() => import('./bootstrap'))
    .catch((err: unknown) => console.error(err));
```

### Shared Bootstrap File

Use this in every app:

```ts
// src/bootstrap.ts
import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app';
import { appConfig } from './app/app.config';

bootstrapApplication(App, appConfig).catch((err: unknown) => console.error(err));
```

The important detail is the dynamic import:

```ts
.then(() => import('./bootstrap'))
```

That delays Angular imports until after Native Federation has prepared the import map.

## Federation Configs

This repo uses ESM config files named `federation.config.mjs`.

Use this rule when reading the configs:

| Role | `federation.config.mjs` should contain |
| --- | --- |
| Host only | `name`, `remotes`, `shared`, `skip` |
| Remote only | `name`, `exposes`, `shared`, `skip` |
| Host+Remote | `name`, `exposes`, `remotes`, `shared`, `skip` |

In this repo:

```text
shell-app = Host only
  has remotes
  does not expose routes to another app

auth-app = Remote only
  has exposes
  does not have remotes

admin-app = Host+Remote
  has exposes because shell-app loads it
  has remotes because admin-app loads auth-app
```

### auth-app/federation.config.mjs

```js
import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
    name: 'auth_app',

    exposes: {
        './routes': './src/app/app.routes.ts',
    },

    shared: {
        ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    },

    skip: [
        'rxjs/ajax',
        'rxjs/fetch',
        'rxjs/testing',
        'rxjs/webSocket',
        '@angular/core/event-dispatch-contract.min.js',
        '@angular/core/primitives/di',
        '@angular/core/primitives/event-dispatch',
        '@angular/core/primitives/signals',
        '@angular/core/rxjs-interop',
    ],
});
```

### admin-app/federation.config.mjs

```js
import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
    name: 'admin_app',

    exposes: {
        './routes': './src/app/app.routes.ts',
    },

    remotes: {
        auth_app: 'http://localhost:4201/remoteEntry.json',
    },

    shared: {
        ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    },

    skip: [
        'rxjs/ajax',
        'rxjs/fetch',
        'rxjs/testing',
        'rxjs/webSocket',
        '@angular/core/event-dispatch-contract.min.js',
        '@angular/core/primitives/di',
        '@angular/core/primitives/event-dispatch',
        '@angular/core/primitives/signals',
        '@angular/core/rxjs-interop',
    ],
});
```

### shell-app/federation.config.mjs

```js
import { withNativeFederation, shareAll } from '@angular-architects/native-federation/config';

export default withNativeFederation({
    name: 'shell_app',

    remotes: {
        auth_app: 'http://localhost:4201/remoteEntry.json',
        admin_app: 'http://localhost:4202/remoteEntry.json',
    },

    shared: {
        ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
    },

    skip: [
        'rxjs/ajax',
        'rxjs/fetch',
        'rxjs/testing',
        'rxjs/webSocket',
        '@angular/core/event-dispatch-contract.min.js',
        '@angular/core/primitives/di',
        '@angular/core/primitives/event-dispatch',
        '@angular/core/primitives/signals',
        '@angular/core/rxjs-interop',
    ],
});
```

> **Removed from earlier drafts of this doc:** a `features: { denseChunking: true }` block. That key is not a documented Native Federation option. If you want to control code-splitting behavior for shared/exposed modules, use the real, documented `chunks` option at the top level of `withNativeFederation({...})` (`chunks: false` disables code-splitting and bundles everything as single files) — leave it unset to keep the default.

If `@angular/core` secondaries create resolution problems, keep the explicit override used in this repo. Note that per-package tuning like `build: 'package'` belongs inside the **second** argument to `shareAll` (the `overrides` object), not as a top-level property of the first argument:

```js
shared: {
...shareAll(
        { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        {
            overrides: {
                '@angular/core': {
                    singleton: true,
                    strictVersion: true,
                    requiredVersion: 'auto',
                    includeSecondaries: false,
                },
            },
        },
    ),
}
```

## Federation Manifests

Only apps that load remotes need a runtime manifest.

| App | Role | Manifest needed? | Why |
| --- | --- | --- | --- |
| `shell-app` | Host only | Yes | It must discover `auth-app` and `admin-app`. |
| `auth-app` | Remote only | No | It exposes modules but does not load another remote. |
| `admin-app` | Host+Remote | Yes | It exposes itself to `shell-app`, but also discovers `auth-app`. |

A manifest answers this question:

```text
When this app asks for remote name X, where is X's remoteEntry.json?
```

### shell-app/public/assets/federation.manifest.json

```json
{
  "auth_app": "http://localhost:4201/remoteEntry.json",
  "admin_app": "http://localhost:4202/remoteEntry.json"
}
```

### admin-app/public/assets/federation.manifest.json

```json
{
  "auth_app": "http://localhost:4201/remoteEntry.json"
}
```

### auth-app

`auth-app` does not need `public/assets/federation.manifest.json` unless it starts loading another remote.

If `auth-app/src/main.ts` calls:

```ts
initFederation('/assets/federation.manifest.json')
```

then that file must exist. Otherwise use:

```ts
initFederation()
```

## Routing

Remote apps must export a named `routes` value:

```ts
// auth-app/src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
    // remote routes
];
```

Hosts load those routes by the federation name and exposed module key, through the local `loadRemote` wrapper — **not** the deprecated top-level `loadRemoteModule` import.

### shell-app route loading

```ts
// shell-app/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { loadRemote } from '@federation-loader';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
    {
        path: '',
        component: ShellComponent,
        children: [
            // Redirects to remote-owned auth routes
            { path: 'login', redirectTo: '/auth/login', pathMatch: 'full' },
            { path: 'register', redirectTo: '/auth/register', pathMatch: 'full' },
            { path: 'forgot-password', redirectTo: '/auth/forgot-password', pathMatch: 'full' },
            { path: 'dashboard', redirectTo: '/auth/dashboard', pathMatch: 'full' },

            // Local routes — owned by shell-app, not federated
            {
                path: '',
                loadComponent: () =>
                    import('./features/home/home.page').then((m) => m.HomePage),
            },
            {
                path: 'products',
                loadComponent: () =>
                    import('./features/catalog/product-list.page').then((m) => m.ProductListPage),
            },
            {
                path: 'products/:slug',
                loadComponent: () =>
                    import('./features/catalog/product-detail.page').then((m) => m.ProductDetailPage),
            },
            {
                path: 'categories/:slug',
                loadComponent: () =>
                    import('./features/catalog/product-list.page').then((m) => m.ProductListPage),
            },
            {
                path: 'brands/:slug',
                loadComponent: () =>
                    import('./features/catalog/product-list.page').then((m) => m.ProductListPage),
            },
            {
                path: 'wishlist',
                loadComponent: () =>
                    import('./features/wishlist/wishlist.page').then((m) => m.WishlistPage),
            },
            {
                path: 'cart',
                loadComponent: () =>
                    import('./features/cart/cart.page').then((m) => m.CartPage),
            },
            {
                path: 'checkout',
                loadComponent: () =>
                    import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
            },
            {
                path: 'orders',
                loadComponent: () =>
                    import('./features/orders/order-list.page').then((m) => m.OrderListPage),
            },
            {
                path: 'orders/:id',
                loadComponent: () =>
                    import('./features/orders/order-detail.page').then((m) => m.OrderDetailPage),
            },

            // Remote auth routes — loaded from auth-app via Native Federation
            {
                path: 'auth',
                loadChildren: () =>
                    loadRemote<{ routes: Routes }>('auth_app', './routes').then((m) => m.routes),
            },

            // Remote admin routes — loaded from admin-app via Native Federation
            {
                path: 'admin',
                loadChildren: () =>
                    loadRemote<{ routes: Routes }>('admin_app', './routes').then((m) => m.routes),
            },
        ],
    },
];
```

### admin-app auth route loading

```ts
// admin-app/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { loadRemote } from '@federation-loader';

export const routes: Routes = [
    {
        path: 'login',
        loadChildren: () =>
            loadRemote<{ routes: Routes }>('auth_app', './routes').then((m) => m.routes),
    },
];
```

The strings must line up:

```text
loadRemote('auth_app', './routes')
           ^          ^
           |          must match the exposes key in auth-app's federation.config.mjs
           must match: name in federation.config.mjs
                       AND the key in the caller's federation.manifest.json
```

This is a three-way match — `federation.config.mjs`'s `name`, the manifest's key, and the `loadRemote(...)` call — and it's case-sensitive. A mismatch in any one of the three is the root cause behind most "remote fails to load" and "404 for remoteEntry.json" issues (see [Troubleshooting](#troubleshooting)).

## Communication Between Shell And Remotes

Native Federation loads modules. It is not a communication system. Choose the communication method based on the relationship between the shell and the remote.

```text
                    Communication
                          |
       +------------------+------------------+
       |                  |                  |
       v                  v                  v
   Callback         Custom Event        Shared State
       |                  |                  |
       v                  v                  v
   Component          Browser API       Store/Service
                          |
                          v
                    Router / URL
                          |
                          v
                     Backend API
```

### Communication Method 1: Callback

Use callbacks for direct parent-to-child component contracts.

```text
Shell
 |
 | onProductSelected()
 v
Remote
 |
 | calls callback
 v
Shell
```

Angular-to-Angular example:

```ts
// remote component
import { Component, input, output } from '@angular/core';

@Component({
    selector: 'app-product-picker',
    template: `
    <button type="button" (click)="selected.emit(productId())">
      Select product
    </button>
  `,
})
export class ProductPickerComponent {
    readonly productId = input.required<string>();
    readonly selected = output<string>();
}
```

Use callbacks when:

- The shell directly renders a component.
- The event is local to that component.
- The shell and remote intentionally have a parent-child contract.

Avoid callbacks when unrelated MFEs need to communicate. They create tight coupling.

### Communication Method 2: CustomEvent

`CustomEvent` is framework-neutral and works well across Angular, React, and Vue.

Remote emits:

```ts
window.dispatchEvent(
    new CustomEvent('product:selected', {
        detail: {
            productId: '123',
        },
    }),
);
```

Shell listens:

```ts
const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ productId: string }>;
    console.log(customEvent.detail.productId);
};

window.addEventListener('product:selected', handler);
```

Cleanup:

```ts
window.removeEventListener('product:selected', handler);
```

Use `CustomEvent` for simple framework-neutral notifications:

- Angular to React.
- Angular to Vue.
- React to Angular.
- Vue to Angular.

Do not put passwords, access tokens, refresh tokens, or secrets in global browser events.

### Typed Communication Contracts

Create small, versionable event contracts.

```ts
export interface ProductSelectedEvent {
    type: 'product:selected';
    detail: {
        productId: string;
    };
}

export interface MfeEvents {
    'product:selected': {
        productId: string;
    };
    'cart:updated': {
        itemCount: number;
    };
    'auth:logout': Record<string, never>;
}
```

Contracts matter because they provide:

- Type safety.
- Documentation.
- Backward compatibility.
- Safer independent deployment.

Keep payloads small. Send identifiers and intent, not full database records.

### Communication Method 3: RxJS

RxJS works best for Angular-to-Angular communication.

```text
Shell
  |
  v
Shared Event Bus
  ^
  |
Remote
```

Example:

```ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type MfeEvent =
    | { type: 'product:selected'; productId: string }
    | { type: 'cart:updated'; itemCount: number }
    | { type: 'auth:logout' };

@Injectable({
    providedIn: 'root',
})
export class MfeEventBus {
    private readonly eventsSubject = new Subject<MfeEvent>();
    readonly events$ = this.eventsSubject.asObservable();

    emit(event: MfeEvent): void {
        this.eventsSubject.next(event);
    }
}
```

Important: the shell and remote must resolve to the same shared service package/runtime if you expect one shared bus instance. If each app bundles its own copy of the event bus library, each app gets a separate bus.

RxJS is less suitable as the primary communication method for React/Vue remotes. For cross-framework communication, prefer `CustomEvent`, Web Components, URL state, or backend APIs.

### Communication Method 4: Shared State

Shared state should be small and intentional.

```text
             Shared State
                  |
        +---------+---------+
        v         v         v
      Shell    Products    Admin
```

Good shared state:

- `currentUser` summary.
- Tenant.
- Locale.
- Theme.
- Cart summary count.

Bad shared state:

- Every form field.
- Every component state.
- Remote-specific UI state.
- Temporary modal state.

Not everything should be global. Keep remote-local state inside the remote.

### Communication Method 5: URL And Router

The URL is often the best communication mechanism for navigation state.

```text
/products/123
/orders/456
/admin/users?page=2
```

Use URL state for:

- Navigation.
- Deep links.
- Browser refresh.
- Bookmarking.
- Browser history.
- Shareable state.

Prefer URL state instead of global state when the state belongs in navigation.

### Communication Method 6: Web Components

Web Components are useful cross-framework UI boundaries.

```text
Angular Shell
      |
      v
<product-widget>
      |
      v
React / Vue / Angular
```

A Web Component can receive:

- Attributes.
- Properties.
- Custom events.

It can also use Shadow DOM when style isolation is important.

Use Web Components when the shell should not know whether the remote is Angular, React, or Vue.

### Communication Method 7: postMessage

`window.postMessage()` is mainly for iframe-based MFEs, separate browser windows, or cross-origin window communication.

Send:

```ts
window.postMessage(
    {
        type: 'auth:logout',
    },
    'https://trusted.example.com',
);
```

Receive with origin validation:

```ts
window.addEventListener('message', (event) => {
    if (event.origin !== 'https://trusted.example.com') {
        return;
    }

    if (event.data?.type === 'auth:logout') {
        console.log('Logout requested');
    }
});
```

Do not use `'*'` casually when a trusted origin is known. `postMessage` is usually unnecessary for normal same-page Native Federation.

### Communication Method 8: Backend API

Business-critical state should be confirmed by the backend.

```text
Products MFE
      |
      v
Backend API
      ^
      |
Orders MFE
```

Do not treat a frontend event as the source of truth for operations such as payment success.

Use this flow:

```text
Frontend
   |
   v
Backend
   |
   v
Validate
   |
   v
Persist
   |
   v
Return authoritative result
```

### Communication Decision Table

| Requirement | Recommended approach |
| --- | --- |
| Parent to direct child | Callback / Input |
| Simple MFE event | CustomEvent |
| Angular-only shared behavior | RxJS/shared service |
| Truly global state | Small shared store |
| Navigation | Router / URL |
| Cross-framework UI | Web Components |
| iframe communication | postMessage |
| Business data | Backend API |
| Authentication state | Secure session plus event/state synchronization |
| Theme | CSS variables / design tokens |

This is a guideline, not an absolute rule.

## Authentication And Session Communication

Authentication should usually be owned by the shell or a shared platform layer, not independently reimplemented in every remote.

```text
                    Identity Provider
                           |
                           v
                    Authentication
                           |
                           v
                     Shell / Session
                           |
            +--------------+--------------+
            v              v              v
        Angular         React           Vue
         MFE             MFE             MFE
```

Key ideas:

- Authentication answers "who is the user?"
- Authorization answers "what is the user allowed to do?"
- Frontend authentication state is not a security boundary.
- The backend must enforce authorization.

Recommended responsibilities:

| Layer | Responsibility |
| --- | --- |
| Shell | Session bootstrap, login/logout UI, route guards, global user summary. |
| Remote | Read user/session through a stable contract. Do not own the whole login system. |
| Backend | Validate session/token and enforce permissions. |

Logout event example:

```ts
window.dispatchEvent(new CustomEvent('auth:logout'));
```

Login event example:

```ts
window.dispatchEvent(
    new CustomEvent('auth:login', {
        detail: {
            userId: '123',
        },
    }),
);
```

The event says something happened. It should not broadcast credentials.

Never broadcast these through global browser events:

- Password.
- Access token.
- Refresh token.
- Secrets.

Production authentication options to evaluate:

- Secure cookies.
- HttpOnly cookies where appropriate.
- SameSite.
- CSRF protection.
- Short token lifetime.
- Refresh token rotation.
- Backend authorization on every protected operation.

## Shared Theme And Design System

A microfrontend architecture should not duplicate the entire visual system in every application.

```text
                    Design System
                         |
             +-----------+-----------+
             v           v           v
          Angular      React        Vue
             |           |           |
             +-----------+-----------+
                         |
                         v
                  Shared Visual Language
```

Use framework-independent design tokens:

```css
:root {
    --color-primary: #12473f;
    --color-primary-hover: #0b332e;
    --color-primary-light: #24786d;
    --color-background: #ffffff;
    --color-surface: #f8faf9;
    --color-text: #17201e;
    --color-border: #d9e2df;
    --spacing-xs: 4px;
    --spacing-sm: 8px;
    --spacing-md: 16px;
    --spacing-lg: 24px;
    --spacing-xl: 32px;
    --radius-sm: 4px;
    --radius-md: 8px;
    --radius-lg: 12px;
}
```

Design tokens can be used by Angular, React, and Vue because they are CSS, not framework APIs.

Shared UI approaches:

| Approach | Best for |
| --- | --- |
| Shared Angular library | Angular to Angular |
| Web Components | Angular to React, Angular to Vue, React/Vue to Angular |
| Design tokens only | Visual consistency with framework-specific UI implementations |

Theme switching should be owned by the shell:

```html
<body data-theme="dark">
```

```css
[data-theme="dark"] {
    --color-background: #101615;
    --color-surface: #17201e;
    --color-text: #ffffff;
}
```

The shell is a good owner for global theme state because all same-page remotes render under the same document.

## Theme Colors

Native Federation does not share colors through `federation.config.mjs`.

The federation config only controls JavaScript module loading:

```text
federation.config.mjs
  remote name
  exposed files
  shared npm packages
  skipped npm packages
```

Theme colors should be handled with normal CSS variables.

When `auth-app` or `admin-app` is loaded inside `shell-app`, the remote is rendered in the same browser document as the shell. Because of that, remote CSS can use variables defined on the shell document.

For beginners, choose one of these two setups:

```text
Option A: Same theme for all apps
  Recommended for this project.
  Shell owns the real colors.
  Auth and admin use the shell variables when hosted.

Option B: Different theme per app
  Use only when auth/admin intentionally need different colors.
  Shell changes variables by route or by active remote.
```

### Option A: Same Theme For Every App

Use this when `shell-app`, `auth-app`, and `admin-app` should all look like one product.

The rule is:

```text
shell-app owns the theme
auth-app and admin-app use the theme variables
remotes define fallback variables only for standalone mode
```

#### 1. Define The Real Theme In Shell

Put the real shared colors in `shell-app/src/styles.css`:

```css
:root {
    --color-primary: #374151;
    --color-primary-hover: #1f2937;
    --color-primary-light: #6b7280;
    --color-secondary: #c88a2d;
    --color-secondary-light: #f2c66d;
    --color-success: #0f7a4f;
    --color-warning: #9a6a00;
    --color-danger: #b42318;
    --color-info: #285f8f;

    --color-background: #f5f7f4;
    --color-surface: #ffffff;
    --color-surface-muted: #edf4f1;
    --color-border: #d7e1dc;
    --color-text-primary: #10201d;
    --color-text-secondary: #475569;
    --color-text-muted: #6b7b86;
    --color-text-inverse: #ffffff;

    --sidebar-bg: var(--color-primary);
    --sidebar-bg-dark: var(--color-primary-hover);
    --sidebar-text: #e7f3f0;
    --sidebar-text-muted: rgba(231, 243, 240, 0.68);
    --sidebar-hover: color-mix(in srgb, var(--color-primary-light) 28%, transparent);
    --sidebar-active: color-mix(in srgb, var(--color-primary-light) 38%, transparent);

    --radius-sm: 0.35rem;
    --radius-md: 0.5rem;
    --radius-lg: 0.75rem;
    --shadow-sm: 0 8px 24px rgba(15, 23, 42, 0.06);
    --shadow-md: 0 18px 44px rgba(15, 23, 42, 0.1);
}
```

#### 2. Mark Shell As The Theme Owner

In `shell-app/src/index.html`, mark the shell document:

```html
<html lang="en" data-mf-app="shell" data-theme-owner="shell">
```

This tells remote fallback CSS that the shell is already providing the theme.

#### 3. Add Fallback Variables In Each Remote

In `auth-app/src/styles.css` and `admin-app/src/styles.css`, define fallback values behind this selector:

```css
:root:not([data-theme-owner="shell"]) {
    --color-primary: #374151;
    --color-primary-hover: #1f2937;
    --color-primary-light: #6b7280;
    --color-secondary: #c88a2d;
    --color-secondary-light: #f2c66d;
    --color-background: #f5f7f4;
    --color-surface: #ffffff;
    --color-border: #d7e1dc;
    --color-text-primary: #10201d;
    --color-text-secondary: #475569;
    --color-text-muted: #6b7b86;
    --color-text-inverse: #ffffff;
}
```

This is how the fallback works:

```text
Remote opened directly:
  No data-theme-owner="shell" exists.
  The remote uses its own fallback variables.

Remote loaded inside shell:
  data-theme-owner="shell" exists on <html>.
  The remote fallback selector does not match.
  The remote uses shell-app variables.
```

#### 4. Use Variables In All App Styles

In shell, auth, and admin component CSS, use variables instead of fixed colors:

```css
.primary-button {
    border: 1px solid var(--color-primary);
    background: var(--color-primary);
    color: var(--color-text-inverse);
}

.page-surface {
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-primary);
}
```

If you change this in `shell-app/src/styles.css`:

```css
:root {
    --color-primary: #0f766e;
}
```

then hosted auth/admin CSS like this changes automatically:

```css
.login-button {
    background: var(--color-primary);
}
```

No TypeScript is needed for Option A. You do not need `data-active-mfe` when every app should use the same colors.

### Option B: Different Theme Per App

Use this only when different routes should intentionally have different colors, for example:

```text
/           -> shell colors
/auth/...   -> auth colors
/admin/...  -> admin colors
```

In this setup, the shell still controls the hosted theme. The remotes still use `var(--color-primary)` and other variables. The difference is that shell changes the variable values depending on the active route.

#### 1. Add Active App Tracking In Shell

In `shell-app/src/app/layout/shell/shell.component.ts`, add route-based document state:

```ts
import { DOCUMENT } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

@Component({
    selector: 'app-shell',
    imports: [RouterOutlet],
    templateUrl: './shell.component.html',
    styleUrl: './shell.component.css',
})
export class ShellComponent implements OnInit {
    private readonly document = inject(DOCUMENT);
    private readonly router = inject(Router);
    private readonly currentUrl = signal(this.router.url);

    readonly isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

    constructor() {
        this.router.events
            .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
            .subscribe((event) => {
                this.currentUrl.set(event.urlAfterRedirects);
                this.syncActiveMicrofrontend(event.urlAfterRedirects);
            });
    }

    ngOnInit(): void {
        this.syncActiveMicrofrontend(this.router.url);
    }

    private syncActiveMicrofrontend(url: string): void {
        const activeMfe = url.startsWith('/auth')
            ? 'auth'
            : url.startsWith('/admin')
                ? 'admin'
                : 'shell';

        this.document.documentElement.dataset['activeMfe'] = activeMfe;
    }
}
```

#### 2. Define Route Themes In Shell CSS

In `shell-app/src/styles.css`, keep the default shell theme in `:root`, then override only the variables that should change:

```css
:root {
    --color-primary: #374151;
    --color-primary-hover: #1f2937;
    --color-primary-light: #6b7280;
}

:root[data-active-mfe='auth'] {
    --color-primary: #285f8f;
    --color-primary-hover: #1f4e75;
    --color-primary-light: #5f8fbd;
}

:root[data-active-mfe='admin'] {
    --color-primary: #0b2925;
    --color-primary-hover: #081f1c;
    --color-primary-light: #2f6d64;
}
```

#### 3. Keep Remote CSS Variable-Based

Auth and admin components should still use variables:

```css
.submit-button {
    background: var(--color-primary);
    color: var(--color-text-inverse);
}
```

Do not hardcode route colors inside remote component CSS. The shell should decide hosted colors.

#### 4. Standalone Remote Colors

If a remote should also have its own color when opened directly, change only that remote's fallback block.

For example, `auth-app/src/styles.css`:

```css
:root:not([data-theme-owner="shell"]) {
    --color-primary: #285f8f;
    --color-primary-hover: #1f4e75;
    --color-primary-light: #5f8fbd;
}
```

And `admin-app/src/styles.css`:

```css
:root:not([data-theme-owner="shell"]) {
    --color-primary: #0b2925;
    --color-primary-hover: #081f1c;
    --color-primary-light: #2f6d64;
}
```

These fallback values only apply when the remote runs by itself. When the remote is loaded inside shell, shell variables win.

### Which Theme Option Should You Use?

| Need | Use |
| --- | --- |
| All apps should look like one application | Option A |
| Changing shell colors should update auth/admin automatically | Option A |
| Auth and admin need their own colors inside shell | Option B |
| Remote should look correct when opened directly | Remote fallback variables |

### App Identification

It is useful to identify each app in HTML, but this does not share the theme by itself:

```html
<!-- shell-app/src/index.html -->
<html lang="en" data-mf-app="shell" data-theme-owner="shell">

<!-- auth-app/src/index.html -->
<html lang="en" data-mf-app="auth">

<!-- admin-app/src/index.html -->
<html lang="en" data-mf-app="admin">
```

Use `data-mf-app` for debugging. Use `data-theme-owner="shell"` to protect shell-owned variables from remote fallback variables.

### What Not To Do

Do not put color values in `federation.config.mjs`:

```js
// Wrong place for theme config
export default withNativeFederation({
    name: 'auth_app',
    theme: {
        primary: '#12473f',
    },
});
```

Native Federation will not apply those values to CSS.

Do not redefine shared `:root` variables unconditionally in remote apps:

```css
/* Avoid this in remotes */
:root {
    --color-primary: red;
}
```

That can override the shell theme when the remote is loaded into the shell.

## Start And Test Locally

Start remotes first, then hosts:

```bash
cd frontend/native-federation/auth-app
npm start

cd ../admin-app
npm start

cd ../shell-app
npm start
```

Verify these URLs:

```text
http://localhost:4201/remoteEntry.json
http://localhost:4202/remoteEntry.json
http://localhost:4200
```

Then test:

```text
http://localhost:4200/auth/login
http://localhost:4200/admin/dashboard
http://localhost:4202/login
```

In browser DevTools, the host should fetch:

```text
http://localhost:4201/remoteEntry.json
http://localhost:4202/remoteEntry.json
```

If you enabled `{ sse: true }` in `startFederation(...)`, the shell should also reload automatically after a remote finishes rebuilding — you shouldn't need to manually refresh while iterating.

## Build

Run from each app:

```bash
npm run build
```

If the command fails immediately with a Node version error, upgrade Node before debugging Angular or federation code. Run `npx ng version` to see the CLI's actual minimum requirement rather than trusting a hardcoded list.

## Production

In production, each app is deployed independently:

| App | Example production URL |
| --- | --- |
| `shell-app` | `https://shop.example.com` |
| `auth-app` | `https://auth.example.com` |
| `admin-app` | `https://admin.example.com` |

Update the runtime manifests for production:

```json
{
  "auth_app": "https://auth.example.com/remoteEntry.json",
  "admin_app": "https://admin.example.com/remoteEntry.json"
}
```

Do not hard-code localhost URLs in a production manifest.

The remote servers must serve JavaScript, JSON, and asset files with CORS headers that allow the host domain.

## Environment Configuration

Do not spread Remote URLs throughout application source code. Keep them in one manifest per environment.

```text
Development
    |
    v
localhost Remote URLs

Staging
    |
    v
staging Remote URLs

Production
    |
    v
production Remote URLs
```

Example files:

```text
shell-app/public/assets/federation.manifest.json
shell-app/public/assets/federation.manifest.staging.json
shell-app/public/assets/federation.manifest.production.json
```

Development manifest:

```json
{
  "auth_app": "http://localhost:4201/remoteEntry.json",
  "admin_app": "http://localhost:4202/remoteEntry.json"
}
```

Production manifest:

```json
{
  "auth_app": "https://auth.example.com/remoteEntry.json",
  "admin_app": "https://admin.example.com/remoteEntry.json"
}
```

The Shell should load the manifest that belongs to the current deployment environment. The exact file replacement can be handled by your CI/CD pipeline, deployment script, or static hosting configuration.

## Shared Dependencies

Shared dependencies are packages that the Shell and Remotes agree to reuse instead of loading separate copies.

In an Angular-to-Angular setup, these packages normally must be shared carefully:

```text
Angular Shell
      |
      +-- @angular/core
      +-- @angular/common
      +-- @angular/router
      +-- rxjs

Angular Remote
      |
      +-- uses compatible shared Angular dependencies
```

In this project, sharing is configured with `shareAll` in each `federation.config.mjs`:

```js
// federation.config.mjs
import { shareAll, withNativeFederation } from '@angular-architects/native-federation/config';

export default withNativeFederation({
    name: 'admin_app',

    exposes: {
        './routes': './src/app/app.routes.ts',
    },

    shared: shareAll({
        singleton: true,
        strictVersion: true,
        requiredVersion: 'auto',
    }),
});
```

Important properties:

| Property | Meaning |
| --- | --- |
| `singleton: true` | Use one runtime instance when possible. This matters for Angular core packages and shared services. |
| `strictVersion: true` | Fail early when incompatible versions are used. This avoids hidden runtime bugs. |
| `requiredVersion: 'auto'` | Read the required version from `package.json`. |

Share Angular runtime packages for Angular-to-Angular remotes. Share `rxjs` when Angular apps rely on common reactive behavior. Share a small internal contracts package if multiple apps need the same event names, models, or schemas.

Do not blindly share every dependency. Do not share packages that are only used by one remote. Do not share UI libraries across frameworks unless the version and styling contract are intentionally managed.

For cross-framework remotes:

```text
Angular runtime != React runtime != Vue runtime
```

Do not try to force Angular, React, and Vue into one shared framework runtime. Use browser-level boundaries such as Web Components, CustomEvent, URL state, backend APIs, and CSS variables.

## Remote Loading Error Handling

Remote loading can fail. The Shell must treat remote loading like a network operation, not like a local import.

```text
Shell
  |
  +-- Remote available   -> load remote route/component
  |
  +-- Remote unavailable -> show fallback UI
```

Common failure reasons:

| Failure | Example |
| --- | --- |
| Remote is down | `http://localhost:4202/remoteEntry.json` returns 404 or connection refused |
| Wrong manifest URL | Shell points to old port or old domain |
| Version mismatch | Shared Angular versions are incompatible |
| Bad expose name | Shell imports `./Routes`, remote exposes `./routes` |
| Broken deployment | Remote assets were not uploaded with `remoteEntry.json` |

For routes, keep the loading boundary at the Shell router level:

```ts
// shell-app/src/app/app.routes.ts
import { Routes } from '@angular/router';
import { loadRemote } from '@federation-loader';

export const routes: Routes = [
    {
        path: 'admin',
        loadChildren: () =>
            loadRemote<{ routes: Routes }>('admin_app', './routes')
                .then((m) => m.routes)
                .catch(() =>
                    import('./shared/remote-unavailable.routes').then(
                        (m) => m.REMOTE_UNAVAILABLE_ROUTES
                    )
                ),
    },
];
```

The fallback can show a normal Angular component that explains the area is temporarily unavailable. In production, also log the failure to monitoring.

## Security

Native Federation loads remote JavaScript into the Shell page.

That means a configured Remote runs in the same browser context as the Shell. Federation is not a sandbox for untrusted code.

Use these rules in production:

| Area | Recommendation |
| --- | --- |
| Remote trust | Only load Remotes owned by your organization or a trusted team. |
| HTTPS | Use HTTPS for Shell, Remotes, APIs, and assets. |
| Remote URLs | Keep remote URLs controlled by environment configuration, not user input. |
| CSP | Use a Content Security Policy that allows only known script and asset origins. |
| Authentication | Avoid broadcasting credentials through frontend events. |
| Authorization | Enforce authorization on the backend, never only in frontend state. |
| Cookies | Evaluate `HttpOnly`, `Secure`, and `SameSite` cookies for session handling. |
| Tokens | Keep token lifetimes short and protect refresh tokens. |
| Dependencies | Scan Shell and Remote dependencies for vulnerabilities. |
| Deployment | Protect CI/CD and artifact storage because deployed remote JavaScript is trusted app code. |

Important statement:

```text
If the Shell loads a Remote JavaScript application, that Remote executes as trusted application code.
Native Federation does not sandbox an untrusted Remote.
```

## CORS Vs Federation

CORS and Native Federation solve different problems.

| Topic | Meaning |
| --- | --- |
| CORS | Browser security policy that controls whether one origin can fetch resources from another origin. |
| Native Federation | Runtime module composition mechanism that loads exposed modules from a Remote. |

CORS may be required when the Shell loads `remoteEntry.json` and remote assets from a different origin. CORS does not prove that a Remote is safe. CORS does not authenticate JavaScript. CORS does not replace backend authorization.

## Versioning And Contracts

Independent deployment only works when contracts stay stable.

Contracts include:

| Contract | Example |
| --- | --- |
| Exposed modules | `./routes`, `./register`, `./ProductWidget` |
| Event names | `product:selected`, `cart:updated`, `auth:logout` |
| Event payloads | `{ productId: string }` |
| URL shape | `/products/:id`, `/admin/users?page=2` |
| Backend API schema | request/response DTOs |
| Design tokens | `--color-primary`, `--spacing-md` |

Keep event payloads small:

```ts
// Good contract
type ProductSelectedPayload = {
    productId: string;
};
```

Avoid exposing whole database objects through frontend events:

```ts
// Avoid this
type ProductSelectedPayload = {
    everythingFromProductDatabase: unknown;
};
```

For shared TypeScript contracts, use a small package such as:

```text
shared-contracts/
  events/
  models/
  schemas/
```

Version contracts intentionally. Prefer backward-compatible additions. Avoid renaming event names, route paths, and exposed module names without a migration plan.

## Independent Deployment

A main reason to use microfrontends is independent deployment.

```text
             CI/CD
               |
       +-------+--------+
       |       |        |
       v       v        v
     Shell   Auth     Admin
       |       |        |
       v       v        v
     Deploy  Deploy   Deploy
       |       |        |
       +-------+--------+
               |
               v
           Production
```

Independent deployment requires discipline:

| Requirement | Why it matters |
| --- | --- |
| Stable exposes | The Shell must still find the Remote module after a Remote deploy. |
| Stable event contracts | Other apps should not break when one app changes. |
| Environment-specific URLs | Dev, staging, and production remotes use different origins. |
| Monitoring | The Shell should know when a Remote fails to load. |
| Rollback | A broken Remote should be rolled back without rebuilding the Shell. |

## Recommended Project Structure

Use clear ownership boundaries:

```text
frontend/
|
+-- native-federation/
|   |
|   +-- shell-app/
|   |   +-- src/
|   |   +-- federation.config.mjs
|   |   +-- angular.json
|   |   +-- package.json
|   |
|   +-- auth-app/
|   |   +-- src/
|   |   +-- federation.config.mjs
|   |   +-- angular.json
|   |   +-- package.json
|   |
|   +-- admin-app/
|   |   +-- src/
|   |   +-- federation.config.mjs
|   |   +-- angular.json
|   |   +-- package.json
|
+-- shared-contracts/
|   +-- events/
|   +-- models/
|   +-- schemas/
|
+-- reports-react/
|   +-- src/
|   +-- federation.config.mjs
|
+-- analytics-vue/
    +-- src/
    +-- federation.config.mjs
```

Share contracts, not application internals. A Remote should own its routes, screens, forms, data fetching, and local UI state. The Shell should own composition, global navigation, authentication session coordination, theme ownership, and environment-level remote URLs.

## Production Architecture

A production architecture usually looks like this:

```text
                         +---------------------+
                         |      CDN / Edge     |
                         +----------+----------+
                                    |
                              Shell Application
                                    |
              +---------------------+---------------------+
              |                     |                     |
              v                     v                     v
        Angular Remote        React Remote           Vue Remote
          Products               Reports              Analytics
              |                     |                     |
              +---------------------+---------------------+
                                    |
                              Backend APIs
                                    |
                         +----------+----------+
                         |          |          |
                         v          v          v
                       Auth       Orders     Products
```

Production concerns:

| Concern | Practical guidance |
| --- | --- |
| CDN/static hosting | Shell and Remotes can be hosted as static assets. |
| Remote entry caching | Cache carefully. `remoteEntry.json` often needs shorter cache lifetime than hashed assets. |
| Hashed assets | Let Angular's build output hashed files for long-term caching. |
| Environment URLs | Use dev/staging/prod manifests instead of editing source code. |
| Monitoring | Track remote load failures and runtime exceptions. |
| Versioning | Version exposed modules and event contracts. |
| Rollback | Keep previous Remote builds deployable. |

## Testing

Test each application at two levels: independently and through the Shell.

| Test type | What to verify |
| --- | --- |
| Remote standalone test | The Remote works on its own local port. |
| Shell integration test | The Shell can fetch `remoteEntry.json` and load the exposed route/module. |
| Contract test | Event names, payload shapes, exposed module names, and route paths still match. |
| Theme test | The Remote uses Shell CSS variables when hosted. |
| Auth test | Login/logout/session state updates are reflected correctly without exposing credentials. |
| Failure test | The Shell shows fallback UI when a Remote is unavailable. |

For Angular-to-Angular projects, also run normal Angular unit/component tests inside each app. For cross-framework remotes, keep framework-specific tests inside the owning Remote and add Shell-level integration tests only for the public contract.

Do not test Remote internals from the Shell. The Shell should test the contract it depends on, not the private implementation of another app.

## Decision Guide

Use this table when choosing a communication strategy:

| Requirement | Recommended approach |
| --- | --- |
| Parent to direct child | Callback / Angular input-output |
| Simple cross-MFE event | `CustomEvent` |
| Angular-only shared behavior | RxJS/shared Angular service |
| Truly global state | Small shared store |
| Navigation | Router / URL |
| Cross-framework UI | Web Components |
| iframe communication | `postMessage` |
| Business data | Backend API |
| Authentication state | Secure session plus event/state synchronization |
| Theme | CSS variables / design tokens |

Decision tree:

```text
Need communication?
        |
        v
Is it navigation?
   |          |
  Yes         No
   |          |
Router     Direct component interaction?
              |          |
             Yes         No
              |          |
          Callback    Simple cross-MFE event?
                         |          |
                        Yes         No
                         |          |
                    CustomEvent   Angular-only shared behavior?
                                      |          |
                                     Yes         No
                                      |          |
                                     RxJS      Global state?
                                                 |          |
                                                Yes         No
                                                 |          |
                                               Store      Cross-framework component?
                                                            |          |
                                                           Yes         No
                                                            |          |
                                                      Web Component  Backend/API
```

Same-framework vs mixed-framework comparison:

| Area | Angular to Angular | Angular to React/Vue |
| --- | --- | --- |
| Native Federation | Easier | More integration work |
| Shared Angular dependencies | Yes | No |
| Shared Angular services | Possible | No |
| RxJS Event Bus | Good | Not ideal |
| CustomEvent | Good | Excellent |
| Web Components | Optional | Recommended |
| Shared UI library | Easier | Difficult |
| CSS Variables | Recommended | Recommended |
| URL communication | Excellent | Excellent |
| Backend API | Excellent | Excellent |
| Authentication | Shared architecture | Shared architecture |
| Complexity | Lower | Higher |

## Anti-Patterns

Avoid these common architecture problems.

### Anti-pattern 1: Everything Goes Through The Shell

```text
Products -> Shell -> Orders
Products -> Shell -> Users
Users    -> Shell -> Admin
```

This makes the Shell a business-logic bottleneck. The Shell should compose applications and own global concerns, not become the central service layer for every feature.

### Anti-pattern 2: Global Store For Everything

```text
Global Store
 +-- Products
 +-- Orders
 +-- Admin
 +-- Forms
 +-- Every Component
```

This removes remote independence. Keep global state small. Use local state inside each Remote for remote-specific forms, tables, modals, filters, and temporary UI.

### Anti-pattern 3: Direct Remote-To-Remote Imports Everywhere

```text
A -> B -> C -> D -> E
```

This creates hidden deployment order and version coupling. Prefer Shell composition, URL contracts, backend APIs, and small shared contracts.

### Anti-pattern 4: Sharing Too Many Dependencies

Excessive sharing makes every app depend on the same package versions. Share framework runtimes and true shared contracts. Keep feature-only dependencies local to the Remote.

### Anti-pattern 5: Framework-Specific Contracts

Bad:

```text
Angular Shell
   |
   v
React-specific object
```

Better:

```text
Shell
  |
  v
Framework-neutral contract
  |
  v
Remote
```

### Anti-pattern 6: Sensitive Data In CustomEvent

Never broadcast these through global browser events:

```text
password
refresh token
access token
secret
```

Events should say that something happened. They should not expose credentials.

### Anti-pattern 7: Using The Deprecated Top-Level `loadRemoteModule`

```ts
// Avoid
import { loadRemoteModule } from '@angular-architects/native-federation';
loadRemoteModule('auth_app', './routes').then((m) => m.routes);
```

This resolves against a separate module-scoped federation instance rather than the one your `startFederation()` call created, and it's marked deprecated in v4. Always route through your app's local `federation-loader.ts` (`loadRemote`) instead — see [Bootstrap Pattern](#bootstrap-pattern).

## Troubleshooting

### Unable To Resolve Specifier '@angular/platform-browser'

Problem: The browser console shows `Unable to resolve specifier '@angular/platform-browser'`.

Cause: Angular was statically imported before Native Federation initialized the import map.

How to diagnose: Open `main.ts`. It should only import `startFederation`/`initFederation` and then dynamically import `bootstrap`.

Fix: Use the `main.ts` and `bootstrap.ts` split shown above. Keep Angular imports out of `main.ts`.

### Unable To Resolve Specifier '@angular/core'

Problem: The browser console shows `Unable to resolve specifier '@angular/core'`.

Cause: Same bootstrap-order problem, or a shared Angular secondary entry point is emitted without a matching import-map entry.

How to diagnose: Check `main.ts`, `angular.json` polyfills, and `federation.config.mjs`.

Fix:

1. Keep Angular imports out of `main.ts`.
2. Keep `es-module-shims` in `angular.json` polyfills.
3. Keep Angular packages shared as singletons.
4. If needed, keep the `@angular/core` override with `includeSecondaries: false`.

### Remote Fails To Load

Problem: The Shell route opens, but the Remote content never appears.

Cause: The Remote is not running, the manifest URL is wrong, or the exposed module name is wrong.

How to diagnose: Open the remote entry URL directly in the browser.

Fix:

```bash
curl http://localhost:4201/remoteEntry.json
curl http://localhost:4202/remoteEntry.json
```

Then verify the Shell manifest and `loadRemote(...)` name.

### 404 For /assets/federation.manifest.json

Problem: The Shell cannot find `federation.manifest.json`.

Cause: `main.ts` calls `startFederation('/assets/federation.manifest.json')`, but the file is missing from `public/assets`.

How to diagnose: Open `http://localhost:4200/assets/federation.manifest.json`.

Fix: Create the manifest for a Shell app. Use `initFederation()` without a manifest only for a pure Remote that does not load other Remotes.

### 404 For remoteEntry.json

Problem: The Shell cannot fetch the Remote entry.

Cause: The Remote app is not running, is running on the wrong port, or the manifest points to the wrong URL.

How to diagnose: Open the exact URL from the manifest.

Fix: Start the Remote first and correct the URL:

```json
{
  "auth_app": "http://localhost:4201/remoteEntry.json",
  "admin_app": "http://localhost:4202/remoteEntry.json"
}
```

### Route Loads The Wrong App Or Fails

Problem: `/auth` or `/admin` loads the wrong remote route or fails.

Cause: Name mismatch between remote config, manifest, and Shell route.

How to diagnose: Verify the same name is used in all three places:

```text
federation.config.mjs name: 'auth_app'
federation.manifest.json "auth_app": "http://localhost:4201/remoteEntry.json"
loadRemote('auth_app', './routes')
```

Fix: Make the names and expose keys exactly match. They are case-sensitive.

### `@federation-loader` Import Not Resolving

Problem: TypeScript or the build fails with a "cannot find module '@federation-loader'" error, even though it resolves in the editor.

Cause: The `paths` alias is defined in one `tsconfig` (e.g. `tsconfig.app.json`) but the federation build target (`serve`/`build` architect config) points `tsConfig` at a different file that doesn't include that mapping.

How to diagnose: Check which `tsConfig` the `@angular-architects/native-federation:build` builder options reference in `angular.json`, and confirm `paths` is defined there.

Fix: Point every relevant builder target at the same `tsconfig.app.json` that defines the `@federation-loader` path, or duplicate the `paths` entry into whichever tsconfig the federation build actually uses.

### Shared Dependency Conflict

Problem: The app fails during remote loading with version or shared package errors.

Cause: Shell and Remote use incompatible package versions or strict singleton sharing rejects the combination.

How to diagnose:

```bash
cd frontend/native-federation/shell-app && npm ls @angular/core rxjs
cd ../auth-app && npm ls @angular/core rxjs
cd ../admin-app && npm ls @angular/core rxjs
```

Fix: Align Angular and RxJS versions, then reinstall and rebuild.

### Angular Runtime Duplicated

Problem: Angular services are duplicated, dependency injection behaves strangely, or routing fails.

Cause: Angular packages are not shared as singletons or versions differ across apps.

How to diagnose: Check `federation.config.mjs` in every Angular app.

Fix: Keep compatible Angular versions and use:

```js
shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' })
```

### React Remote Does Not Render

Problem: The React Remote loads but nothing appears in the Angular Shell.

Cause: Angular is trying to consume React internals directly, or the React mount lifecycle is not called.

How to diagnose: Check whether the React Remote exposes a framework-neutral registration or mount API.

Fix: Prefer a Web Component boundary such as `<reports-widget>`, or expose a `mount(element, props)` contract and call cleanup on destroy.

### Vue Remote Does Not Render

Problem: The Vue Remote loads but the widget is blank.

Cause: The custom element is not registered, props are not passed correctly, or Vue assets failed to load.

How to diagnose: Check DevTools custom elements, network assets, and console errors.

Fix: Register the Vue Web Component once, pass primitive attributes or properties, and emit `CustomEvent` for Shell communication.

### CustomEvent Not Received

Problem: A Remote dispatches an event but the Shell handler never runs.

Cause: Event name mismatch, listener registered too late, event does not bubble from a Web Component, or listener is attached to the wrong target.

How to diagnose: Log the exact event name at dispatch and listener registration.

Fix: Use shared event-name constants, dispatch on `window` for global events, or set `bubbles: true` and `composed: true` when dispatching from a Web Component.

### Event Listener Not Cleaned Up

Problem: The same event handler runs multiple times after navigating.

Cause: The Shell or Remote adds listeners repeatedly without removing them.

How to diagnose: Navigate away and back, then dispatch one event and count logs.

Fix: Remove listeners in `ngOnDestroy`, React cleanup functions, or Vue unmount hooks.

### RxJS Event Bus Not Shared

Problem: Shell emits to the event bus, but the Remote does not receive it.

Cause: Shell and Remote each created their own service instance or package copy.

How to diagnose: Confirm the event bus lives in a shared package and that dependencies resolve as singletons.

Fix: Share the event bus package deliberately, align versions, and use RxJS event bus mainly for Angular-to-Angular communication.

### Theme Not Applied

Problem: The Remote uses different colors inside the Shell.

Cause: The Remote uses hard-coded colors, or it overrides `:root` variables after the Shell theme is applied.

How to diagnose: Inspect computed CSS variables on `html`, `body`, and remote elements.

Fix: Define theme variables in the Shell and make Remotes consume `var(--color-...)`. Put Remote fallback variables behind:

```css
:root:not([data-theme-owner="shell"]) {
    --color-primary: #374151;
}
```

### CSS Conflicts

Problem: Styles from one app affect another app unexpectedly.

Cause: Global selectors are too broad.

How to diagnose: Use DevTools to inspect which stylesheet owns the winning rule.

Fix: Prefer scoped component styles, app-specific wrapper classes, design tokens, and Web Component Shadow DOM where isolation is needed.

### Web Component Not Registered

Problem: Angular renders `<reports-widget>` but the browser treats it as an unknown element.

Cause: The remote registration module was not loaded before the element appeared.

How to diagnose: Run `customElements.get('reports-widget')` in DevTools.

Fix: Load the registration remote first:

```ts
await loadRemote('reports_app', './register');
```

### postMessage Origin Rejected

Problem: An iframe or external window message is ignored.

Cause: The receiver rejects the sender origin, or the sender posts to the wrong target origin.

How to diagnose: Log `event.origin` in a development-only handler.

Fix: Use the exact trusted origin on both send and receive sides. Avoid `"*"` when the origin is known.

### Authentication State Not Synchronized

Problem: Header shows logged in, but a Remote behaves like the user is logged out.

Cause: Authentication state is duplicated or the Remote does not refresh its session view after login.

How to diagnose: Check the Shell session state, backend session endpoint, and auth events.

Fix: Let the Shell coordinate session state, let backend APIs validate authorization, and emit safe events such as `auth:login` or `auth:logout` without credentials.

### Logout Not Propagated

Problem: User logs out in one area, but another MFE still shows protected UI.

Cause: Other MFEs were not notified or did not re-check backend session state.

How to diagnose: Watch for the `auth:logout` event and route guards.

Fix: Clear local UI state, notify MFEs with a safe event, and make protected API calls fail closed on the backend.

### CORS Error

Problem: Browser blocks `remoteEntry.json` or remote assets.

Cause: The Remote server does not allow the Shell origin.

How to diagnose: Check the browser Network tab and response headers.

Fix: Configure the Remote server/CDN to allow the Shell origin for federation assets.

### Production Remote URL Incorrect

Problem: Production Shell still loads localhost or staging Remotes.

Cause: Wrong manifest was deployed.

How to diagnose: Open production `assets/federation.manifest.json`.

Fix: Generate or deploy environment-specific manifests for dev, staging, and production.

### Remote Deployment Unavailable

Problem: A deployed Shell route fails after a Remote deploy.

Cause: Remote `remoteEntry.json` points to missing assets, CDN cache is stale, or the Remote deployment failed.

How to diagnose: Open `remoteEntry.json`, then open referenced assets from the same deployment.

Fix: Deploy remote assets atomically, use sensible cache headers, keep rollback artifacts, and monitor remote load failures.

## Recommended Learning Order

Beginners should not start with Angular, React, and Vue at the same time.

Recommended path:

1. Understand Angular.
2. Understand Angular lazy loading.
3. Understand Native Federation.
4. Build Angular Shell to Angular Remote.
5. Learn remote routing.
6. Learn `CustomEvent`.
7. Learn shared state.
8. Learn authentication communication.
9. Learn shared design tokens.
10. Learn Web Components.
11. Add a React Remote.
12. Add a Vue Remote.
13. Add production deployment.
14. Add monitoring and security.

Start with Angular-to-Angular first. Add cross-framework integration only after the federation fundamentals are working.

## Complete Example Architecture

This is a realistic final shape for a growing system:

```text
                        Angular Shell
                             |
       +---------------------+---------------------+
       |                     |                     |
       v                     v                     v
 Angular Auth          Angular Admin         React Reports
       |                     |                     |
       |                     |                     |
       +-------------+-------+---------------------+
                     |
                     v
               Shared Contracts
                     |
          +----------+----------+
          |          |          |
          v          v          v
      CustomEvent   URL      Backend API
                     |
                     v
                  Vue MFE
```

Example user journey:

1. User opens the Angular Shell at `http://localhost:4200`.
2. Shell initializes Native Federation from `assets/federation.manifest.json`.
3. User visits `/admin/dashboard`.
4. Shell loads `admin_app` from `http://localhost:4202/remoteEntry.json`.
5. Admin Remote exposes `./routes`, and Angular lazy-loads those routes.
6. User selects a product inside a product feature.
7. Product feature emits `product:selected` with `{ productId: string }`.
8. Shell receives the event and navigates to `/checkout/123`.
9. Checkout Remote loads and calls the backend API.
10. Backend validates the order and returns the authoritative result.
11. Checkout emits a small `cart:updated` or `order:completed` event.
12. Shell header updates the cart summary.
13. The theme remains consistent because Shell-owned CSS variables apply to every hosted MFE.

This example uses Native Federation for module composition, router URLs for navigation, CustomEvent for lightweight cross-MFE notification, backend APIs for business truth, and CSS variables for shared visual language.

## Final Architecture Rules

Rule 1: Use Native Federation for module composition.

Rule 2: Do not use federation as a communication system.

Rule 3: Prefer the simplest communication mechanism.

Rule 4: Use Router/URL for navigation.

Rule 5: Use `CustomEvent` for framework-neutral events.

Rule 6: Use RxJS/shared services mainly for Angular-only communication.

Rule 7: Use Web Components for framework-neutral UI boundaries.

Rule 8: Use backend APIs as the source of truth for business data.

Rule 9: Keep global state small.

Rule 10: Share only dependencies that should actually be shared.

Rule 11: Use CSS variables/design tokens for cross-framework themes.

Rule 12: Do not expose sensitive credentials through frontend events.

Rule 13: Never trust frontend state for authorization.

Rule 14: Treat loaded Remote JavaScript as trusted application code.

Rule 15: Keep communication contracts small and versionable.

Rule 16: Start with Angular-to-Angular before introducing mixed frameworks.

Rule 17: Always route remote loading through your app's `federation-loader.ts` (`loadRemote`), never the deprecated top-level `loadRemoteModule`.

## Checklist

Use this when adding another remote app:

1. Install `@angular-architects/native-federation` and `es-module-shims`.
2. Configure `@angular-architects/native-federation:build`.
3. Add `federation.config.mjs`.
4. Give the remote a stable federation name.
5. Expose `./routes`.
6. Split `main.ts` and `bootstrap.ts`.
7. Add `src/federation-loader.ts` (Host or Host+Remote apps only) and set up the `@federation-loader` path alias.
8. Add the remote to the host's `public/assets/federation.manifest.json`.
9. Load it with `loadRemote(remoteName, './routes')` — not the deprecated top-level `loadRemoteModule`.
10. Choose the theme strategy: same theme for every app, or intentionally different themes per app.
11. For the same theme, define the real variables in `shell-app/src/styles.css`.
12. Mark shell HTML with `data-theme-owner="shell"`.
13. Put remote fallback variables behind `:root:not([data-theme-owner="shell"])`.
14. Use `var(--color-...)` in shell, auth, and admin component styles.
15. Add `data-active-mfe` route logic only if you intentionally want different hosted colors for `/auth` and `/admin`.
16. Start the remote first.
17. Verify `remoteEntry.json` in the browser.
18. Add a loading and error fallback in the Shell route.
19. Define communication contracts before sending cross-MFE events.
20. Keep authentication credentials out of browser events.
21. Use backend authorization for protected data.
22. Use CSS variables for shared theme values.
23. Keep global shared state small.
24. Add monitoring for remote loading failures.
25. Document the remote's exposed modules and supported events.