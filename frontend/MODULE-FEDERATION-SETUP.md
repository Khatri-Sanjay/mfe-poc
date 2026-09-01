# Module Federation with Vite - Microfrontend Guide

This guide explains Micro Frontends and Module Federation from the beginning, then shows a practical Vite setup using one consistent federation implementation.

Verified on 2026-08-31:

- Vite is the build tool and dev server.
- Module Federation is added by a plugin. Vite does not provide Module Federation by itself.
- This guide uses `@module-federation/vite`.
- Older tutorials often use `@originjs/vite-plugin-federation`. Do not mix that syntax with this guide.
- Angular CLI uses a modern build system with esbuild and Vite for development serving, but the Angular CLI Vite dev server is encapsulated and is not directly configured through `vite.config.ts`.
- If you need direct Vite plugin control for Angular, use a custom Vite pipeline such as AnalogJS. If you want the normal Angular CLI path, use Angular Native Federation instead of Vite Module Federation.

References:

- Vite guide: https://vite.dev/guide/
- Module Federation Vite plugin: https://module-federation.io/integrations/build-tool/vite.html
- Angular application build system: https://angular.dev/tools/cli/build-system-migration
- Angular custom build pipeline: https://angular.dev/ecosystem/custom-build-pipeline

---

## 1. What Are Micro Frontends?

A Micro Frontend is a way to split one large frontend application into smaller frontend applications.

Example: an e-commerce application.

```text
E-commerce Application
|
|-- Products
|-- Users
|-- Orders
|-- Payments
`-- Admin
```

In a normal frontend monolith, all of these features live in one app, one build, and one deployment. That can become slow and hard to maintain.

With Micro Frontends, each feature can be its own app:

```text
E-commerce Shell
|
|-- Products Remote
|-- Users Remote
|-- Orders Remote
`-- Admin Remote
```

Each remote can be developed, built, and deployed separately. Micro Frontends do not automatically solve architecture problems. They add runtime boundaries. Use them when independent ownership and deployment matter enough to justify the extra complexity.

---

## 2. What Is Module Federation?

Module Federation lets one JavaScript application load code from another separately built JavaScript application at runtime.

Important terms:

| Term | Meaning |
| --- | --- |
| Host | The application that consumes remote modules. Also called the shell. |
| Remote | The application that exposes modules for another app to load. |
| Expose | A public module made available by a remote. |
| Remote entry | The file the host reads to discover what a remote exposes. |
| Shared dependency | A package that host and remote can reuse instead of loading twice. |

Basic runtime picture:

```text
                 HOST
                  |
                  | loads
                  v
              REMOTE APP
                  |
                  `-- Exposed Component
```

Runtime flow:

```text
1. Browser opens the host app.
2. User navigates to a route such as /products.
3. Host sees that /products belongs to a remote.
4. Host fetches the remote entry from the products app.
5. Module Federation runtime reads the remote metadata.
6. Host downloads the remote JavaScript chunks.
7. Host renders the exposed component or route.
```

The host does not need the remote code bundled inside its own build. It only needs to know where the remote entry is.

---

## 3. Why Vite?

Vite is a modern frontend build tool. During development, it serves source files quickly using native browser ESM. For production, it builds optimized assets.

Developers use Vite because it usually gives fast dev startup, fast refresh, simple configuration, TypeScript support, and a strong plugin ecosystem.

Older Module Federation examples are often Webpack-based because Module Federation originally shipped with Webpack 5. Vite is different: Vite does not include Module Federation by default.

Use this mental model:

```text
Vite
+
@module-federation/vite
=
Federated Vite application
```

This guide chooses `@module-federation/vite` because it is the Module Federation project Vite integration and its configuration uses the Module Federation 2 style APIs. Other Vite federation solutions exist, such as `@originjs/vite-plugin-federation`, but they use different configuration syntax.

---

## 4. Architecture

Example architecture:

```text
                        +---------------------+
                        |       HOST          |
                        |      Shell          |
                        |  localhost:4200     |
                        +----------+----------+
                                   |
                +------------------+------------------+
                |                  |                  |
                v                  v                  v
        +-------------+    +-------------+    +-------------+
        |  Products   |    |    Users    |    |   Orders    |
        |   Remote    |    |   Remote    |    |   Remote    |
        |    :4201    |    |    :4202    |    |    :4203    |
        +-------------+    +-------------+    +-------------+
```

| App | Port | Role |
| --- | --- | --- |
| `shell` | `4200` | Main host. Owns layout, top-level routing, auth shell, and remote URLs. |
| `products` | `4201` | Remote. Exposes product UI. |
| `users` | `4202` | Remote. Exposes user UI. |
| `orders` | `4203` | Remote. Exposes order UI. |

The host decides where a route goes. The remote owns the feature implementation.

---

## 5. Prerequisites

Use current stable versions for new projects. Do not copy old Vite or federation examples from older tutorials without checking the package syntax.

| Software | Recommended |
| --- | --- |
| Node.js | Vite currently requires Node.js `20.19+` or `22.12+`. Use current LTS when possible. |
| npm | Bundled with Node.js. npm `10+` or newer is fine. |
| Vite | Installed by `npm create vite@latest`. |
| React | Needed for the beginner working example in this guide. |
| Angular | Current Angular docs are for Angular `22.x`; use matching Angular package versions across host and remotes. |
| Vue | Needed only if you build Vue remotes. |

Check locally:

```bash
node --version
npm --version
```

Expected result: Node satisfies the Vite requirement and npm is available.

---

## 6. Project Structure

Use separate applications. A monorepo is convenient, but each app should still be independently buildable.

```text
microfrontends/
|
|-- shell/
|   |-- src/
|   |-- module-federation.config.ts
|   |-- vite.config.ts
|   `-- package.json
|
|-- products/
|   |-- src/
|   |-- module-federation.config.ts
|   |-- vite.config.ts
|   `-- package.json
|
|-- users/
|   |-- src/
|   |-- module-federation.config.ts
|   |-- vite.config.ts
|   `-- package.json
|
`-- orders/
    |-- src/
    |-- module-federation.config.ts
    |-- vite.config.ts
    `-- package.json
```

Each app has its own dependencies, dev server, build output, and deployment target.

---

## 7. Create The Host

This beginner example uses React because React has first-class Vite templates and keeps the Module Federation concepts easy to see.

```bash
mkdir microfrontends
cd microfrontends
npm create vite@latest shell -- --template react-ts
cd shell
npm install
npm add @module-federation/vite react-router-dom
```

### `shell/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'shell',
  remotes: {
    products: {
      type: 'module',
      name: 'products',
      entry: 'http://localhost:4201/remoteEntry.js',
    },
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
    'react-dom/': {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
  },
});
```

Use the React version that is actually installed in your `package.json`. If your app installs React 18, use a React 18 range instead of `^19.0.0`.

### `shell/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import mfConfig from './module-federation.config';

export default defineConfig({
  server: {
    port: 4200,
    origin: 'http://localhost:4200',
  },
  base: 'http://localhost:4200/',
  plugins: [react(), federation(mfConfig)],
  build: {
    target: 'chrome89',
  },
});
```

### `shell/src/remotes.d.ts`

```ts
import type { ComponentType } from 'react';

declare module 'products/ProductsApp' {
  const ProductsApp: ComponentType;
  export default ProductsApp;
}
```

### `shell/src/App.tsx`

```tsx
import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

const ProductsApp = lazy(() => import('products/ProductsApp'));

function Home() {
  return <h1>Shell Home</h1>;
}

export default function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>{' '}
        <Link to="/products">Products</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/products/*"
          element={
            <Suspense fallback={<p>Loading remote...</p>}>
              <ProductsApp />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
```

### `shell/src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

Expected result: the shell can run on port `4200` and `/products` will try to load `products/ProductsApp`.

---

## 8. Create The Remote

```bash
cd ..
npm create vite@latest products -- --template react-ts
cd products
npm install
npm add @module-federation/vite
```

### `products/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'products',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductsApp': './src/ProductsApp.tsx',
  },
  shared: {
    react: {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
    'react-dom': {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
    'react-dom/': {
      singleton: true,
      requiredVersion: '^19.0.0',
    },
  },
});
```

`exposes` means: "make this local file available to a host under this public name."

```text
'./ProductsApp': './src/ProductsApp.tsx'
|                |
|                real local file in the remote
public name used by the host
```

### `products/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import mfConfig from './module-federation.config';

export default defineConfig({
  server: {
    port: 4201,
    origin: 'http://localhost:4201',
  },
  preview: {
    port: 4201,
  },
  base: 'http://localhost:4201/',
  plugins: [react(), federation(mfConfig)],
  build: {
    target: 'chrome89',
  },
});
```

### `products/src/ProductsApp.tsx`

```tsx
export default function ProductsApp() {
  return (
    <section>
      <h1>Products Remote</h1>
      <p>This UI is served by the products application.</p>
    </section>
  );
}
```

### `products/src/App.tsx`

```tsx
import ProductsApp from './ProductsApp';

export default function App() {
  return <ProductsApp />;
}
```

Expected result: products runs by itself on port `4201` and exposes `./ProductsApp`.

---

## 9. Connect Host And Remote

The host remote config says:

```ts
products: {
  type: 'module',
  name: 'products',
  entry: 'http://localhost:4201/remoteEntry.js',
}
```

The remote expose config says:

```ts
exposes: {
  './ProductsApp': './src/ProductsApp.tsx',
}
```

The host consumes it with:

```ts
const ProductsApp = lazy(() => import('products/ProductsApp'));
```

The import string has two parts:

```text
products/ProductsApp
|        |
|        expose key without the leading "./"
remote name
```

Static import:

```ts
import ProductsApp from 'products/ProductsApp';
```

Lazy import:

```ts
const ProductsApp = lazy(() => import('products/ProductsApp'));
```

Prefer lazy imports for real microfrontend routes because the remote is downloaded only when the user enters that feature.

---

## 10. Routing

Routing usually belongs to the host at the top level.

```text
Browser URL
   |
   v
Host Router
   |
   v
Remote Module
   |
   v
Remote Component
```

Example:

```text
/products
   |
   v
shell router
   |
   v
import('products/ProductsApp')
   |
   v
ProductsApp renders
```

### `shell/src/App.tsx`

```tsx
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';

const ProductsApp = lazy(() => import('products/ProductsApp'));

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<h1>Shell Home</h1>} />
      <Route
        path="/products/*"
        element={
          <Suspense fallback={<p>Loading products...</p>}>
            <ProductsApp />
          </Suspense>
        }
      />
    </Routes>
  );
}
```

The remote can have internal routing under `/products/*`, but the host should own the first-level route decision.

---

## 11. Shared Dependencies

Shared dependencies are packages that host and remote should not duplicate at runtime.

Good candidates:

- `react`
- `react-dom`
- `@angular/core`
- `@angular/common`
- `@angular/router`
- `rxjs`
- A shared design-system package used by all apps.

Why this matters:

```text
Bad case:
Host loads React copy A
Remote loads React copy B
Result: hooks/context/runtime behavior can break
```

Correct React sharing:

```ts
shared: {
  react: {
    singleton: true,
    requiredVersion: '^19.0.0',
  },
  'react-dom': {
    singleton: true,
    requiredVersion: '^19.0.0',
  },
  'react-dom/': {
    singleton: true,
    requiredVersion: '^19.0.0',
  },
}
```

Correct Angular sharing when using Angular with a federation-capable custom build:

```ts
shared: {
  '@angular/core': {
    singleton: true,
    requiredVersion: '^22.0.0',
  },
  '@angular/common': {
    singleton: true,
    requiredVersion: '^22.0.0',
  },
  '@angular/router': {
    singleton: true,
    requiredVersion: '^22.0.0',
  },
  rxjs: {
    singleton: true,
    requiredVersion: '^7.8.0',
  },
}
```

Do not blindly share every dependency. Usually do not share small utilities, feature-only packages, or unstable internal packages.

Rule of thumb:

```text
Share framework/runtime dependencies carefully.
Keep feature dependencies local unless there is a clear reason to share them.
```

---

## 12. Local Development

| Application | Port | Purpose |
| --- | --- | --- |
| Shell | `4200` | Host |
| Products | `4201` | Remote |
| Users | `4202` | Remote |
| Orders | `4203` | Remote |

Start the remote first:

```bash
cd microfrontends/products
npm run dev
```

Then start the host:

```bash
cd ../shell
npm run dev
```

Open:

```text
http://localhost:4200
```

Expected result:

```text
The shell loads.
Clicking Products navigates to /products.
The browser fetches http://localhost:4201/remoteEntry.js.
The products UI renders inside the shell.
```

If the products remote is not running, the host cannot load `/products`.

---

## 13. Build Process

Build flow:

```text
Remote source
     |
     v
Vite build
     |
     v
Remote assets
     |
     v
remoteEntry.js
     |
     v
Deployed server
     |
     v
Host loads remote at runtime
```

Build each app:

```bash
cd microfrontends/products
npm run build

cd ../shell
npm run build
```

The host and remote can be built independently. A products deployment does not require rebuilding the shell if the remote URL, exposed module names, and shared dependency versions remain compatible.

---

## 14. Production Deployment

Example deployment:

| App | URL |
| --- | --- |
| Shell | `https://app.example.com` |
| Products | `https://products.example.com` |
| Users | `https://users.example.com` |
| Orders | `https://orders.example.com` |

Remote URL by environment:

```text
Development:
  products remote entry -> http://localhost:4201/remoteEntry.js

Staging:
  products remote entry -> https://products.staging.example.com/remoteEntry.js

Production:
  products remote entry -> https://products.example.com/remoteEntry.js
```

Production concerns:

- Serve remote assets with correct CORS headers.
- Deploy remote assets to a stable URL.
- Do not cache `remoteEntry.js` too aggressively.
- Cache hashed chunks aggressively.
- Keep exposed module contracts stable.
- Monitor remote loading failures.
- Roll back a remote independently when needed.

Example CORS header for a remote static server:

```text
Access-Control-Allow-Origin: https://app.example.com
```

---

## 15. Environment Configuration

Do not hard-code every remote URL directly in application source.

```text
Development -> localhost URLs
Staging     -> staging remote URLs
Production  -> production remote URLs
```

### `shell/.env.development`

```dotenv
VITE_PRODUCTS_REMOTE_ENTRY=http://localhost:4201/remoteEntry.js
```

### `shell/.env.production`

```dotenv
VITE_PRODUCTS_REMOTE_ENTRY=https://products.example.com/remoteEntry.js
```

### `shell/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export function createShellFederationConfig(productsRemoteEntry: string) {
  return createModuleFederationConfig({
    name: 'shell',
    remotes: {
      products: {
        type: 'module',
        name: 'products',
        entry: productsRemoteEntry,
      },
    },
  });
}
```

### `shell/vite.config.ts`

```ts
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import { createShellFederationConfig } from './module-federation.config';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const productsRemoteEntry =
    env.VITE_PRODUCTS_REMOTE_ENTRY ?? 'http://localhost:4201/remoteEntry.js';

  return {
    server: {
      port: 4200,
      origin: 'http://localhost:4200',
    },
    base: 'http://localhost:4200/',
    plugins: [react(), federation(createShellFederationConfig(productsRemoteEntry))],
    build: {
      target: 'chrome89',
    },
  };
});
```

This is build-time environment configuration. Vite reads the correct `.env` file for the selected mode, and the federation config receives the right remote URL.

If you need "build once, deploy everywhere", use a runtime configuration file loaded before bootstrapping the app. That is more advanced and should be designed deliberately.

---

## 16. Error Handling

Remote loading can fail.

Safe pattern:

```text
Host
 |
 |-- Remote available -> Load Remote
 |
 `-- Remote unavailable -> Show fallback
```

### `shell/src/RemoteBoundary.tsx`

```tsx
import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  fallback: ReactNode;
};

type State = {
  hasError: boolean;
};

export class RemoteBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('Remote failed to load', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
```

### `shell/src/App.tsx`

```tsx
import { lazy, Suspense } from 'react';
import { RemoteBoundary } from './RemoteBoundary';

const ProductsApp = lazy(() => import('products/ProductsApp'));

export function ProductsRoute() {
  return (
    <RemoteBoundary fallback={<p>Products are unavailable.</p>}>
      <Suspense fallback={<p>Loading products...</p>}>
        <ProductsApp />
      </Suspense>
    </RemoteBoundary>
  );
}
```

Expected result: if products fails, the user sees a controlled fallback instead of a blank page.

---

## 17. Loading And Performance

| Concept | Beginner explanation |
| --- | --- |
| Lazy loading | Load a remote only when the user visits that feature. |
| Code splitting | Build tools split code into smaller chunks. |
| Shared dependencies | Avoid loading duplicate framework runtimes. |
| Caching | Reuse already downloaded files. |
| Remote entry caching | Keep this conservative because it points to current chunks. |

Recommendations:

- Lazy-load route-level remotes.
- Share framework dependencies carefully.
- Keep remote entry files easy to refresh.
- Use long cache lifetimes for hashed assets.
- Avoid sharing small dependencies that do not matter.
- Measure before optimizing aggressively.

---

## 18. Communication Between Microfrontends

Avoid making every remote directly depend on every other remote. Prefer simple, stable contracts.

### Option 1: Custom Events

```text
Products
   |
   `-- Custom Event
          |
          v
        Host
```

```ts
window.dispatchEvent(
  new CustomEvent('cart:item-added', {
    detail: { productId: 'p100', quantity: 1 },
  }),
);
```

Host listener:

```ts
window.addEventListener('cart:item-added', (event) => {
  const customEvent = event as CustomEvent<{ productId: string; quantity: number }>;
  console.log(customEvent.detail);
});
```

Use this for simple cross-app notifications.

### Option 2: Shared State

Use shared state only when many apps truly need the same live state, such as current user display name, feature flags, or cart summary count. Do not share every feature's private state.

### Option 3: URL And Router State

Use route params and query params when the state belongs in the URL.

```text
/products/shoes
/orders?status=pending
```

### Option 4: Shared Libraries

A shared library can hold contracts, types, utility functions, or design tokens.

```text
More shared code = more consistency
More shared code = more coordination and versioning work
```

Recommendation: use URL state and events first, shared state only when necessary, and shared libraries for stable contracts.

---

## 19. Authentication

Authentication should usually be owned by the shell or a shared platform layer, not reimplemented separately in every remote.

```text
                 Authentication
                       |
                       v
                     HOST
                       |
          +------------+------------+
          v            v            v
       Products      Users        Orders
```

| Layer | Responsibility |
| --- | --- |
| Host | Own login state, route protection, session bootstrap, and logout. |
| Remote | Reads current user/session through a stable contract or API. |
| Backend | Validates tokens and permissions. |

Security guidance:

- Do not trust the remote alone for authorization.
- Enforce permissions on the backend.
- Avoid copying token handling code into every remote.
- Prefer secure, HTTP-only cookie sessions when your backend architecture supports them.
- If using bearer tokens, keep token handling centralized and avoid passing tokens through arbitrary custom events.

Module Federation does not solve authentication. It only loads code.

---

## 20. Angular + Vite + Module Federation

Angular needs careful explanation because there are three related but different setups people often mix up.

### Angular Microfrontend Options

| Angular setup | Package/config style | When to use |
| --- | --- | --- |
| Angular CLI + Native Federation | `@angular-architects/native-federation` with `federation.config.mjs` | Recommended for modern Angular CLI microfrontends. This is the setup used by this repository's native federation apps. |
| Angular + Vite Module Federation | custom Vite pipeline plus `@module-federation/vite` | Use only when you have direct `vite.config.ts` control and intentionally want Vite Module Federation. |
| Angular + Webpack Module Federation | `@angular-architects/module-federation` with `webpack.config.js` | Older/common Angular Module Federation setup. Useful for Webpack-based Angular projects, but not the Vite setup used in this guide. |

The rest of this document uses `@module-federation/vite` for Vite examples. Do not copy Webpack config into a Vite app, and do not copy Native Federation config into a Module Federation app.

### Angular CLI Vite Usage

Modern Angular uses a new build system with ESM output, esbuild, and Vite-powered development serving. The Angular CLI dev server uses Vite internally, but that Vite configuration is encapsulated by Angular CLI.

That means this is not the same as a normal Vite app with a directly editable `vite.config.ts`.

For standard Angular CLI microfrontends, the more natural modern path is Native Federation:

```text
Angular CLI
+
@angular-architects/native-federation
=
Angular Native Federation setup
```

Beginner rule:

```text
If you are using normal Angular CLI apps:
  use Native Federation.

If you are using a real Vite app with vite.config.ts:
  use @module-federation/vite.

If you are using Webpack Angular:
  use @angular-architects/module-federation.
```

### Angular With Vite Module Federation

For Vite Module Federation specifically, Angular needs direct Vite plugin control:

```text
Angular source
+
custom Vite pipeline, for example AnalogJS Vite plugin for Angular
+
@module-federation/vite
=
Angular app participating in Vite Module Federation
```

Use this only if your team is ready to maintain a custom build pipeline.

The important files would look like this:

```text
angular-shell/
|-- src/
|-- vite.config.ts
|-- module-federation.config.ts
`-- package.json

angular-products/
|-- src/
|-- vite.config.ts
|-- module-federation.config.ts
`-- package.json
```

The key point is that `@module-federation/vite` is registered inside `vite.config.ts`. A normal Angular CLI app does not expose this direct Vite plugin setup.

### Angular Remote Concept

An Angular remote can expose a standalone component or routes.

Example public expose:

```text
./ProductsRoutes -> ./src/app/products.routes.ts
```

The Angular remote owns the route file:

### `angular-products/src/app/products.routes.ts`

```ts
import { Routes } from '@angular/router';

export const PRODUCTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./products-page.component').then((m) => m.ProductsPageComponent),
  },
];
```

The remote exposes that route file:

### `angular-products/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'angular_products',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductsRoutes': './src/app/products.routes.ts',
  },
  shared: {
    '@angular/core': {
      singleton: true,
      requiredVersion: '^22.0.0',
    },
    '@angular/common': {
      singleton: true,
      requiredVersion: '^22.0.0',
    },
    '@angular/router': {
      singleton: true,
      requiredVersion: '^22.0.0',
    },
    rxjs: {
      singleton: true,
      requiredVersion: '^7.8.0',
    },
  },
});
```

The Angular host points to the remote entry:

### `angular-shell/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'angular_shell',
  remotes: {
    angular_products: {
      type: 'module',
      name: 'angular_products',
      entry: 'http://localhost:4201/remoteEntry.js',
    },
  },
  shared: {
    '@angular/core': {
      singleton: true,
      requiredVersion: '^22.0.0',
    },
    '@angular/common': {
      singleton: true,
      requiredVersion: '^22.0.0',
    },
    '@angular/router': {
      singleton: true,
      requiredVersion: '^22.0.0',
    },
    rxjs: {
      singleton: true,
      requiredVersion: '^7.8.0',
    },
  },
});
```

The host imports:

```ts
import('angular_products/ProductsRoutes')
```

The string means:

```text
angular_products/ProductsRoutes
|                |
|                exposed route module
remote name
```

### Angular Sharing

Share Angular runtime dependencies as singletons:

```ts
shared: {
  '@angular/core': {
    singleton: true,
    requiredVersion: '^22.0.0',
  },
  '@angular/common': {
    singleton: true,
    requiredVersion: '^22.0.0',
  },
  '@angular/router': {
    singleton: true,
    requiredVersion: '^22.0.0',
  },
  rxjs: {
    singleton: true,
    requiredVersion: '^7.8.0',
  },
}
```

Match `requiredVersion` to your actual Angular package versions.

### Angular Host Loading Angular Remote

Host route:

```ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'products',
    loadChildren: () =>
      import('angular_products/ProductsRoutes').then((m) => m.PRODUCTS_ROUTES),
  },
];
```

Type declaration:

```ts
declare module 'angular_products/ProductsRoutes' {
  import type { Routes } from '@angular/router';
  export const PRODUCTS_ROUTES: Routes;
}
```

### Angular Native Federation Path

If your apps are normal Angular CLI apps, use Native Federation instead of Vite Module Federation.

That setup usually has:

```text
shell-app/
|-- federation.config.mjs
|-- public/assets/federation.manifest.json
`-- src/main.ts

auth-app/
|-- federation.config.mjs
`-- src/main.ts

admin-app/
|-- federation.config.mjs
`-- src/main.ts
```

Remote example:

```js
// auth-app/federation.config.mjs
import { shareAll, withNativeFederation } from '@angular-architects/native-federation/config';

export default withNativeFederation({
  name: 'auth_app',
  exposes: {
    './routes': './src/app/app.routes.ts',
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
```

Host manifest example:

```json
// shell-app/public/assets/federation.manifest.json
{
  "auth_app": "http://localhost:4201/remoteEntry.json",
  "admin_app": "http://localhost:4202/remoteEntry.json"
}
```

Host route example:

```ts
import { loadRemoteModule } from '@angular-architects/native-federation';
import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () =>
      loadRemoteModule('auth_app', './routes').then((m) => m.routes),
  },
];
```

Native Federation uses `remoteEntry.json`. Vite Module Federation examples in this document use `remoteEntry.js`. Keep that difference clear.

### Angular Webpack Module Federation Path

Older Angular Module Federation tutorials often use this package:

```bash
npm add @angular-architects/module-federation
```

That setup normally uses:

```text
webpack.config.js
@angular-architects/module-federation/webpack
withModuleFederationPlugin(...)
```

That is valid for Webpack-based Angular Module Federation, but it is not the Vite Module Federation setup shown in this guide.

Important: the exact Angular + Vite build configuration depends on the custom Vite pipeline you choose. Do not paste Webpack `ModuleFederationPlugin` or Angular Native Federation `federation.config.mjs` syntax into a Vite Module Federation app.

---

## 21. Same Framework Vs Mixed Framework

### Same Framework

```text
Angular Shell
    |
    |-- Angular Products
    |-- Angular Users
    `-- Angular Orders
```

This is simpler because routing concepts match, dependency sharing is easier, UI reuse is easier, and teams use the same tooling.

### Mixed Framework

```text
Angular Shell
    |
    |-- Angular Products
    |-- React Reports
    `-- Vue Admin
```

This is possible, but more complex. You must handle framework lifecycle boundaries, styling isolation, duplicated framework runtimes, communication contracts, design system compatibility, and different build workflows.

Common approach for mixed frameworks:

```text
Remote framework component
        |
        v
Web Component boundary
        |
        v
Host renders custom element
```

Mixed frameworks are justified when a team has a strong reason to use a different framework, you are migrating gradually, or a feature is independently owned with clear boundaries. They are not justified only because different developers prefer different frameworks.

---

## 22. Module Federation Vs Native Federation

| Feature | Module Federation | Native Federation |
| --- | --- | --- |
| Browser ESM | Modern implementations can target ESM, especially with Vite/Rspack. | Designed around browser-native ESM and import maps. |
| Webpack dependency | Originated in Webpack 5, but now has integrations for other build tools. | Not tied to Webpack. |
| Vite compatibility | Use `@module-federation/vite` for Vite projects. | Angular Native Federation can also work with Vite-oriented ESM flows. |
| Angular | Possible, but standard Angular CLI does not expose direct Vite plugin config. Webpack-based Angular MF is older. | Often the cleaner modern Angular CLI-friendly choice. |
| Mixed frameworks | Good fit when using a consistent Vite/Rspack/Webpack federation runtime strategy. | Possible, but often most natural in ESM/import-map based setups. |
| Existing ecosystem | Large ecosystem and many examples. Some examples are outdated Webpack-specific snippets. | Smaller but attractive for Angular ESM-first microfrontends. |
| Complexity | Powerful, but shared dependencies and runtime URLs require care. | Avoids some bundler coupling, but import maps and bootstrap order need care. |

Choose Module Federation with Vite when your apps already use direct Vite config, you want the Module Federation runtime model, and you can manage contracts carefully.

Choose Native Federation when you are building modern Angular CLI microfrontends and want ESM/import-map based federation.

Neither option is universally better.

---

## 23. Common Mistakes And Troubleshooting

### Remote Module Not Found

What it means: the host tried to import something like `products/ProductsApp`, but federation could not resolve it.

Why it happens:

- Remote name mismatch.
- Expose key mismatch.
- Type declaration exists but runtime expose does not.

Fix:

```text
Remote name: products
Expose key: ./ProductsApp
Host import: products/ProductsApp
```

### Failed To Fetch Remote Entry

What it means: the browser could not download `remoteEntry.js`.

Diagnose:

```bash
curl http://localhost:4201/remoteEntry.js
```

Fix:

```bash
cd microfrontends/products
npm run dev
```

Then reload the host.

### CORS Error

What it means: the browser blocked the host from reading remote assets from another origin.

Fix production headers:

```text
Access-Control-Allow-Origin: https://app.example.com
```

### Shared Dependency Conflict

What it means: host and remote loaded incompatible versions of a framework dependency.

Diagnose:

```bash
npm ls react react-dom
npm ls @angular/core @angular/router rxjs
```

Fix:

- Align framework versions.
- Share runtime framework packages.
- Avoid sharing unstable feature packages.

### Version Mismatch

What it means: the remote expects one dependency version, but the host provides another incompatible version.

Fix:

- Keep framework versions compatible across apps.
- Deploy breaking changes carefully.
- Version remote contracts.

### Remote Works Independently But Not From Host

Why it happens:

- Wrong expose path.
- Remote depends on global setup that only exists in standalone mode.
- Host and remote routing conflict.
- Shared dependency issue.

Fix:

- Test the exposed module directly.
- Keep remote exposed modules self-contained.
- Do not rely on standalone-only bootstrap code for hosted modules.

---

## 24. Production Best Practices

1. Keep MFEs independently deployable.
2. Keep exposed contracts small and stable.
3. Avoid excessive shared state.
4. Share framework dependencies carefully.
5. Lazy-load route-level remotes.
6. Use environment-specific remote URLs.
7. Add loading and error boundaries.
8. Monitor remote loading failures.
9. Version remote contracts.
10. Avoid tightly coupling every MFE to the shell.
11. Keep ownership clear between teams.
12. Do not use Micro Frontends only to organize folders.
13. Document which app owns each route.
14. Keep shared design tokens stable.
15. Test host and remote integration before release.

---

## 25. Complete Working Example

This minimal example creates:

```text
shell host
+
products remote
+
route /products
+
shared React dependencies
```

### Step 1: Create Apps

```bash
mkdir microfrontends
cd microfrontends

npm create vite@latest shell -- --template react-ts
npm create vite@latest products -- --template react-ts
```

### Step 2: Install Dependencies

```bash
cd shell
npm install
npm add @module-federation/vite react-router-dom

cd ../products
npm install
npm add @module-federation/vite
```

### Step 3: Configure Products Remote

`products/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'products',
  filename: 'remoteEntry.js',
  exposes: {
    './ProductsApp': './src/ProductsApp.tsx',
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-dom/': { singleton: true },
  },
});
```

`products/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import mfConfig from './module-federation.config';

export default defineConfig({
  server: {
    port: 4201,
    origin: 'http://localhost:4201',
  },
  base: 'http://localhost:4201/',
  plugins: [react(), federation(mfConfig)],
  build: {
    target: 'chrome89',
  },
});
```

`products/src/ProductsApp.tsx`

```tsx
export default function ProductsApp() {
  return (
    <main>
      <h1>Products Remote</h1>
      <p>This component is exposed from the products app.</p>
    </main>
  );
}
```

`products/src/App.tsx`

```tsx
import ProductsApp from './ProductsApp';

export default function App() {
  return <ProductsApp />;
}
```

### Step 4: Configure Shell Host

`shell/module-federation.config.ts`

```ts
import { createModuleFederationConfig } from '@module-federation/vite';

export default createModuleFederationConfig({
  name: 'shell',
  remotes: {
    products: {
      type: 'module',
      name: 'products',
      entry: 'http://localhost:4201/remoteEntry.js',
    },
  },
  shared: {
    react: { singleton: true },
    'react-dom': { singleton: true },
    'react-dom/': { singleton: true },
  },
});
```

`shell/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import mfConfig from './module-federation.config';

export default defineConfig({
  server: {
    port: 4200,
    origin: 'http://localhost:4200',
  },
  base: 'http://localhost:4200/',
  plugins: [react(), federation(mfConfig)],
  build: {
    target: 'chrome89',
  },
});
```

`shell/src/remotes.d.ts`

```ts
import type { ComponentType } from 'react';

declare module 'products/ProductsApp' {
  const ProductsApp: ComponentType;
  export default ProductsApp;
}
```

`shell/src/App.tsx`

```tsx
import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';

const ProductsApp = lazy(() => import('products/ProductsApp'));

export default function App() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>{' '}
        <Link to="/products">Products</Link>
      </nav>

      <Routes>
        <Route path="/" element={<h1>Shell Home</h1>} />
        <Route
          path="/products/*"
          element={
            <Suspense fallback={<p>Loading products...</p>}>
              <ProductsApp />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}
```

`shell/src/main.tsx`

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

### Step 5: Run Locally

Terminal 1:

```bash
cd microfrontends/products
npm run dev
```

Terminal 2:

```bash
cd microfrontends/shell
npm run dev
```

Open:

```text
http://localhost:4200
```

Expected result:

```text
Home route shows Shell Home.
/products loads Products Remote.
Network tab shows remoteEntry.js fetched from localhost:4201.
```

### Step 6: Build

```bash
cd microfrontends/products
npm run build

cd ../shell
npm run build
```

Expected result:

```text
products builds its remote assets and remoteEntry.js.
shell builds separately and still knows where products remoteEntry.js is.
```

---

## Final Checklist

A beginner should now be able to answer:

- What is a Microfrontend?
- What is Module Federation?
- What is a Host?
- What is a Remote?
- What does `exposes` mean?
- What does `remotes` mean?
- How does the Host find the Remote?
- What happens when a Remote is loaded?
- How are dependencies shared?
- How do I run the applications locally?
- How do I deploy them independently?
- How do I handle a Remote being unavailable?
- How does routing work?
- How do Angular applications participate?
- What changes when Angular and React/Vue are mixed?
- When should I use Module Federation versus Native Federation?

---

## Do Not Mix These Approaches

Use one approach per setup:

| Approach | Config file style |
| --- | --- |
| Vite Module Federation | `module-federation.config.ts` with `@module-federation/vite` |
| OriginJS Vite Federation | `vite.config.ts` with `@originjs/vite-plugin-federation` |
| Webpack Module Federation | `webpack.config.js` with Webpack `ModuleFederationPlugin` |
| Angular Native Federation | `federation.config.mjs` with `@angular-architects/native-federation` |

This document uses only:

```text
@module-federation/vite
```

for working Vite Module Federation examples.
