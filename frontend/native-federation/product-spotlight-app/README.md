# Product Spotlight React Remote

Standalone React Native Federation remote used by the Angular `shell-app`.

## Purpose

This app owns the product spotlight UI on the storefront home page. It calls the existing NestJS ecommerce API and exposes a Web Component registration module through Native Federation.

```text
shell-app HomePage
  -> app-product-spotlight-remote
    -> product_spotlight_app ./register
      -> <product-spotlight-widget>
        -> React ProductSpotlight
```

## Native Federation Contract

Remote name:

```text
product_spotlight_app
```

Exposed module:

```text
./register -> ./src/register.tsx
```

Remote entry:

```text
http://localhost:4203/remoteEntry.json
```

This app intentionally does not share React packages with the Angular apps:

```js
shared: {}
```

The Angular host consumes a federated JavaScript module that registers a custom element. It does not import or render a React component directly.

## API

The widget uses the existing public product endpoint:

```text
GET http://localhost:3000/api/v1/products?limit=6&sortBy=price&sortOrder=asc&inStock=true
```

No backend changes are required because the ecommerce API already exposes public catalog data.

## Run

Install dependencies:

```bash
npm install
```

Start the remote for local development:

```bash
npm start
```

This runs a Native Federation build first and then serves the generated app with Vite preview on port `4203`.

Build only:

```bash
npm run build
```

Open:

```text
http://localhost:4203
http://localhost:4203/remoteEntry.json
```

`http://localhost:4203` shows the standalone React widget page.

`http://localhost:4203/remoteEntry.json` shows Native Federation metadata. Seeing JSON there is correct:

```json
{
  "$version": "v4",
  "name": "product_spotlight_app",
  "shared": [],
  "exposes": [
    {
      "key": "./register",
      "outFileName": "register.js"
    }
  ]
}
```

The Angular shell reads this JSON to discover that `product_spotlight_app` exposes `./register`. The browser should not render the React UI from this URL.

If port `4203` is already in use:

```bash
npm run dev:4204
```

If you use a different port, update `shell-app/src/environments/environment.ts` so `productSpotlightRemoteEntry` points to the same remote entry URL.

## Why `scripts/build.mjs` Exists

This is a React app, not an Angular app. Angular Native Federation apps use the Angular builder wrapper in `angular.json`. A React app does not have that builder, so it needs a small build integration script that:

- Initializes Native Federation.
- Runs esbuild for the React source.
- Generates `remoteEntry.json`.
- Generates the exposed `./register` module.

There is no custom server script anymore. Vite serves the generated `dist` folder.

## Host Integration

The Angular shell loads the remote from:

```text
shell-app/src/app/features/product-spotlight/product-spotlight-remote.component.ts
```

The remote URL is configured in:

```text
shell-app/src/environments/environment.ts
```

The widget sends DOM events:

```text
product-spotlight-select
product-spotlight-view-all
```

The Angular wrapper receives those events and navigates with Angular Router.
