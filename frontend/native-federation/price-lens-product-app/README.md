# Price Lens Product App

React Native Federation remote for product price comparison and product intelligence.

## Feature

Price Lens compares one existing catalog product against normalized external source offers from the backend:

```text
GET http://localhost:3000/api/v1/product-comparison/:productId
```

The current backend uses mock source adapters, so the full flow works without retailer API keys or scraping.

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
http://localhost:4204?productId=<product-uuid>
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
    options?: { apiBaseUrl?: string; productId?: string },
  ) => { unmount: () => void };
};

const remote = await loadRemote<PriceLensRemote>('price_lens_product_app', './mount');

const root = remote.mount(outletElement, {
  apiBaseUrl: 'http://localhost:3000/api/v1',
  productId,
});
```

Unmount when the Angular route wrapper is destroyed:

```ts
root.unmount();
```

## Files

- `src/App.tsx`: comparison UI, loading, error, and manual product ID entry.
- `src/api.ts`: typed API client.
- `src/types.ts`: backend response types.
- `src/mount.tsx`: Native Federation mount contract.
- `federation.config.mjs`: remote name and exposed module.
- `scripts/build.mjs`: Native Federation esbuild build.
