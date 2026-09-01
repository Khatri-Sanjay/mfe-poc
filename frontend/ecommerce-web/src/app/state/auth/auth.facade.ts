import { computed, inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AuthResponse, User } from '../../core/models/commerce.models';
import { AuthService, LoginPayload, RegisterPayload } from '../../core/auth/auth.service';
import { TokenStorageService } from '../../core/auth/token-storage.service';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private readonly auth = inject(AuthService);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);
  private refreshPromise: Promise<string> | null = null;

  readonly currentUser = signal<User | null>(this.storage.user);
  readonly loading = signal(false);
  readonly accessToken = signal(this.storage.accessToken);
  readonly refreshToken = signal(this.storage.refreshToken);
  readonly isAuthenticated = computed(() => Boolean(this.accessToken()));
  readonly roles = computed(() => this.currentUser()?.roles ?? []);
  readonly permissions = computed(() => this.currentUser()?.permissions ?? []);

  async login(payload: LoginPayload): Promise<void> {
    this.store(await this.auth.login(payload));
  }

  async register(payload: RegisterPayload): Promise<void> {
    this.store(await this.auth.register(payload));
  }

  async loadCurrentUser(): Promise<void> {
    if (!this.accessToken()) return;
    const user = await this.auth.me();
    this.currentUser.set(user);
    this.storage.storeUser(user);
  }

  async refreshAccessToken(): Promise<string> {
    if (!this.refreshToken()) {
      this.clear();
      throw new Error('Missing refresh token');
    }

    this.refreshPromise ??= this.auth
      .refresh(this.refreshToken())
      .then((tokens) => {
        this.accessToken.set(tokens.accessToken);
        this.refreshToken.set(tokens.refreshToken);
        this.storage.storeTokens(tokens.accessToken, tokens.refreshToken);
        if (this.currentUser()) {
          this.storage.store(tokens.accessToken, tokens.refreshToken, this.currentUser() as User);
        }
        return tokens.accessToken;
      })
      .catch((error) => {
        this.clear();
        void this.router.navigate(['/auth/login']);
        throw error;
      })
      .finally(() => {
        this.refreshPromise = null;
      });

    return this.refreshPromise;
  }

  async logout(): Promise<void> {
    const token = this.refreshToken();
    this.clear();
    if (token) {
      await this.auth.logout(token).catch(() => undefined);
    }
    await this.router.navigate(['/']);
  }

  async logoutAll(): Promise<void> {
    await this.auth.logoutAll();
    this.clear();
    await this.router.navigate(['/auth/login']);
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
  }

  private store(auth: AuthResponse): void {
    this.accessToken.set(auth.accessToken);
    this.refreshToken.set(auth.refreshToken);
    this.currentUser.set(auth.user);
    this.storage.store(auth.accessToken, auth.refreshToken, auth.user);
  }

  private clear(): void {
    this.accessToken.set('');
    this.refreshToken.set('');
    this.currentUser.set(null);
    this.storage.clear();
  }
}
