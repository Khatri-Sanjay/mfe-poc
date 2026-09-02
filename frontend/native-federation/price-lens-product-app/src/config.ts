declare const __PRICE_LENS_API_BASE_URL__: string | undefined;

const configuredApiBaseUrl =
  typeof __PRICE_LENS_API_BASE_URL__ === 'string' && __PRICE_LENS_API_BASE_URL__.length > 0
    ? __PRICE_LENS_API_BASE_URL__
    : undefined;

export const PRICE_LENS_API_BASE_URL = configuredApiBaseUrl ?? 'http://localhost:3000/api/v1';
