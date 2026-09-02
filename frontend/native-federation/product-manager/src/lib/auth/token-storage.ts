export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
const LEGACY_ACCESS_TOKEN_KEY = 'access-token';

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export const tokenStorage = {
  getAccessToken(): string | null {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(ACCESS_TOKEN_KEY) ?? window.localStorage.getItem(LEGACY_ACCESS_TOKEN_KEY);
  },

  getRefreshToken(): string | null {
    if (!canUseStorage()) return null;
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setAccessToken(token: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  },

  setRefreshToken(token: string) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
  },

  setTokens(accessToken: string, refreshToken?: string | null) {
    if (!canUseStorage()) return;
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    if (refreshToken) window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearAccessToken() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
  },

  clearTokens() {
    if (!canUseStorage()) return;
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(LEGACY_ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
