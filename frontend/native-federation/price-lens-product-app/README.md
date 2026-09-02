# Price Lens Product App

React Native Federation remote for product price comparison and product intelligence.

## Feature

Price Lens searches by product name and compares normalized marketplace offers from the backend:

```text
GET http://localhost:3000/api/v1/product-comparison/search/items?query=<product-name>
```

The backend uses source adapters. Local adapters return deterministic Amazon, Flipkart, and Croma-style offers so the flow works without retailer API keys. Production adapters can be replaced with authorized marketplace APIs, feeds, or scraping providers without changing the remote contract.

Configure the backend URL when deploying the remote independently:

```bash
VITE_PRICE_LENS_API_BASE_URL=https://api.example.com/api/v1
```

## Local Development

Install dependencies:

```bash
npm install
```

Build federation artifacts and serve locally:

```bash
npm run dev:4204
```

Open:

```text
http://localhost:4204/price-lens
http://localhost:4204/price-lens/search/iphone%2015
```

## Native Federation Contract

This remote exposes:

```text
price_lens_product_app -> ./mount -> ./src/mount.tsx
```

Shell usage:

```ts
type PriceLensRemote = {
  mount: (
    element: HTMLElement,
    options?: { routeBasePath?: string },
  ) => { unmount: () => void };
};

const remote = await loadRemote<PriceLensRemote>('price_lens_product_app', './mount');

const root = remote.mount(outletElement, {
  routeBasePath: '/price-lens',
});
```

Unmount when the Angular route wrapper is destroyed:

```ts
root.unmount();
```

## Files

- `src/App.tsx`: React Router app shell.
- `src/routes/AppRoutes.tsx`: React route definitions.
- `src/pages/PriceLensPage.tsx`: product search and comparison UI.
- `src/api.ts`: typed API client.
- `src/config.ts`: remote-owned API URL configuration.
- `src/types.ts`: backend response types.
- `src/mount.tsx`: Native Federation mount contract.
- `federation.config.mjs`: remote name and exposed module.
- `scripts/build.mjs`: Native Federation esbuild build.
