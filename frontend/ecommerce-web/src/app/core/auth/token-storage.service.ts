import { Injectable } from '@angular/core';
import { User } from '../models/commerce.models';

const accessTokenKey = 'ecommerce_access_token';
const refreshTokenKey = 'ecommerce_refresh_token';
const userKey = 'ecommerce_user';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  get accessToken(): string {
    return sessionStorage.getItem(accessTokenKey) ?? '';
  }

  get refreshToken(): string {
    return sessionStorage.getItem(refreshTokenKey) ?? '';
  }

  get user(): User | null {
    const raw = sessionStorage.getItem(userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  store(accessToken: string, refreshToken: string, user: User): void {
    sessionStorage.setItem(accessTokenKey, accessToken);
    sessionStorage.setItem(refreshTokenKey, refreshToken);
    sessionStorage.setItem(userKey, JSON.stringify(user));
  }

  storeAccessToken(accessToken: string): void {
    sessionStorage.setItem(accessTokenKey, accessToken);
  }

  storeTokens(accessToken: string, refreshToken: string): void {
    sessionStorage.setItem(accessTokenKey, accessToken);
    sessionStorage.setItem(refreshTokenKey, refreshToken);
  }

  storeUser(user: User): void {
    sessionStorage.setItem(userKey, JSON.stringify(user));
  }

  clear(): void {
    sessionStorage.removeItem(accessTokenKey);
    sessionStorage.removeItem(refreshTokenKey);
    sessionStorage.removeItem(userKey);
  }
}
