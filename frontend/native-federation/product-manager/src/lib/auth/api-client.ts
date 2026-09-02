'use client';

import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getProductManagerConfig } from '@/lib/config/product-manager-config';
import { tokenStorage } from './token-storage';

export const AUTH_EXPIRED_EVENT = 'product-manager:auth-expired';

export const apiClient = axios.create({
  headers: { Accept: 'application/json' },
});

const refreshClient = axios.create({
  headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

type UnknownRecord = Record<string, unknown>;

function objectValue(value: unknown): UnknownRecord | null {
  return value !== null && typeof value === 'object' ? (value as UnknownRecord) : null;
}

function stringFrom(record: UnknownRecord | null, keys: string[]): string | null {
  if (!record) return null;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return null;
}

function extractTokens(payload: unknown): { accessToken: string | null; refreshToken: string | null } {
  const root = objectValue(payload);
  const data = objectValue(root?.data);
  const nestedData = objectValue(data?.data);

  const candidates = [root, data, nestedData];

  for (const candidate of candidates) {
    const accessToken = stringFrom(candidate, ['accessToken', 'access_token', 'token']);
    if (accessToken) {
      return {
        accessToken,
        refreshToken: stringFrom(candidate, ['refreshToken', 'refresh_token']),
      };
    }
  }

  return { accessToken: null, refreshToken: null };
}

function emitAuthExpired() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
}

let refreshPromise: Promise<string | null> | null = null;

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clearTokens();
      emitAuthExpired();
      return null;
    }

    try {
      const { apiBaseUrl, refreshEndpoint, refreshTokenField } = getProductManagerConfig();
      const response = await refreshClient.post(
        refreshEndpoint ?? '/api/v1/auth/refresh',
        {
          [refreshTokenField ?? 'refreshToken']: refreshToken,
        },
        {
          baseURL: apiBaseUrl,
        },
      );

      const tokens = extractTokens(response.data);
      if (!tokens.accessToken) throw new Error('Refresh response did not contain an access token.');

      tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      return tokens.accessToken;
    } catch {
      tokenStorage.clearTokens();
      emitAuthExpired();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function bootstrapAuthSession(): Promise<boolean> {
  const accessToken = tokenStorage.getAccessToken();
  if (accessToken) return true;

  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  return Boolean(await refreshAccessToken());
}

apiClient.interceptors.request.use((config) => {
  const runtimeConfig = getProductManagerConfig();
  const accessToken = tokenStorage.getAccessToken();
  config.baseURL = runtimeConfig.apiBaseUrl;

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  if (!config.headers['Content-Type'] && config.data !== undefined) {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    if (!original || error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Never attempt to refresh the refresh endpoint itself.
    const { refreshEndpoint } = getProductManagerConfig();
    if (typeof original.url === 'string' && original.url.includes(refreshEndpoint ?? '/api/v1/auth/refresh')) {
      tokenStorage.clearTokens();
      emitAuthExpired();
      return Promise.reject(error);
    }

    original._retry = true;
    const accessToken = await refreshAccessToken();

    if (!accessToken) return Promise.reject(error);

    original.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient(original);
  },
);

export function getApiErrorMessage(error: unknown, fallback = 'Request failed.'): string {
  if (axios.isAxiosError(error)) {
    const body = objectValue(error.response?.data);
    const message = body?.message;

    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(', ');

    const nested = objectValue(body?.error);
    if (typeof nested?.message === 'string') return nested.message;

    if (error.message) return error.message;
  }

  if (error instanceof Error) return error.message;
  return fallback;
}
