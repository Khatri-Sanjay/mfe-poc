export interface ProductManagerRuntimeConfig {
    apiBaseUrl?: string;
    refreshEndpoint?: string;
    refreshTokenField?: string;
    loginUrl?: string;
    redirectOnMissingAuth?: boolean;
}

declare global {
    interface Window {
        __PRODUCT_MANAGER_CONFIG__?: ProductManagerRuntimeConfig;
    }
}

function nextPublic(name: 'API_BASE_URL' | 'REFRESH_ENDPOINT' | 'REFRESH_TOKEN_FIELD' | 'LOGIN_URL' | 'REDIRECT_ON_MISSING_AUTH') {
    // Next.js replaces these explicit NEXT_PUBLIC_ references in the standalone build.
    if (typeof process === 'undefined') return undefined;
    const values = {
        API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
        REFRESH_ENDPOINT: process.env.NEXT_PUBLIC_REFRESH_ENDPOINT,
        REFRESH_TOKEN_FIELD: process.env.NEXT_PUBLIC_REFRESH_TOKEN_FIELD,
        LOGIN_URL: process.env.NEXT_PUBLIC_LOGIN_URL,
        REDIRECT_ON_MISSING_AUTH: process.env.NEXT_PUBLIC_REDIRECT_ON_MISSING_AUTH,
    };
    return values[name];
}

export function getProductManagerConfig(): ProductManagerRuntimeConfig {
    const runtime = typeof window !== 'undefined' ? window.__PRODUCT_MANAGER_CONFIG__ ?? {} : {};
    return {
        apiBaseUrl: runtime.apiBaseUrl ?? nextPublic('API_BASE_URL') ?? '',
        refreshEndpoint: runtime.refreshEndpoint ?? nextPublic('REFRESH_ENDPOINT') ?? '/api/v1/auth/refresh',
        refreshTokenField: runtime.refreshTokenField ?? nextPublic('REFRESH_TOKEN_FIELD') ?? 'refreshToken',
        loginUrl: runtime.loginUrl ?? nextPublic('LOGIN_URL') ?? '',
        redirectOnMissingAuth:
            runtime.redirectOnMissingAuth ?? (nextPublic('REDIRECT_ON_MISSING_AUTH') === 'true'),
    };
}

export function mergeProductManagerConfig(config: ProductManagerRuntimeConfig) {
    if (typeof window === 'undefined') return;
    window.__PRODUCT_MANAGER_CONFIG__ = {
        ...(window.__PRODUCT_MANAGER_CONFIG__ ?? {}),
        ...Object.fromEntries(Object.entries(config).filter(([, value]) => value !== undefined && value !== '')),
    };
}
