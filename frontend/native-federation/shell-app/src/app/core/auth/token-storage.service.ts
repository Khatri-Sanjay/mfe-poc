import { Injectable } from '@angular/core';
import { User } from '../models/commerce.models';

const accessTokenKey = 'access_token';
const refreshTokenKey = 'refresh_token';
const userKey = 'shell_user';
const legacyAccessTokenKey = 'shell_access_token';
const legacyRefreshTokenKey = 'shell_refresh_token';
const adminAccessTokenKey = 'admin_access_token';
const adminRefreshTokenKey = 'admin_refresh_token';
const adminUserKey = 'admin_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string {
    return localStorage.getItem(accessTokenKey) ?? sessionStorage.getItem(legacyAccessTokenKey) ?? '';
  }

  get refreshToken(): string {
    return localStorage.getItem(refreshTokenKey) ?? sessionStorage.getItem(legacyRefreshTokenKey) ?? '';
  }

  get user(): User | null {
    const raw = localStorage.getItem(userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  store(accessToken: string, refreshToken: string, user: User): void {
    localStorage.setItem(accessTokenKey, accessToken);
    localStorage.setItem(refreshTokenKey, refreshToken);
    localStorage.setItem(userKey, JSON.stringify(user));
    this.clearLegacy();
  }

  storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(accessTokenKey, accessToken);
    localStorage.setItem(refreshTokenKey, refreshToken);
    this.clearLegacy();
  }

  storeUser(user: User): void {
    localStorage.setItem(userKey, JSON.stringify(user));
  }

  clear(): void {
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    localStorage.removeItem(userKey);
    localStorage.removeItem(adminAccessTokenKey);
    localStorage.removeItem(adminRefreshTokenKey);
    localStorage.removeItem(adminUserKey);
    this.clearLegacy();
  }

  private clearLegacy(): void {
    sessionStorage.removeItem(legacyAccessTokenKey);
    sessionStorage.removeItem(legacyRefreshTokenKey);
    sessionStorage.removeItem(userKey);
  }
}
