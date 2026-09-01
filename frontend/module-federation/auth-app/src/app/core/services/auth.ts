import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  User,
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  VerifyEmailRequest,
  ResendVerificationRequest,
  MessageResponse,
} from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'auth_user';

  private readonly _user = signal<User | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  readonly user = this._user.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoggedIn = computed(() => !!this._user());
  readonly isEmailVerified = computed(() => !!this._user()?.emailVerified);
  readonly isAdmin = computed(() => {
    const u = this._user();
    if (!u) return false;
    return u.roles.some(
      (r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
    );
  });

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {
    this.loadUserFromStorage();
  }

  get accessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, data).pipe(
      tap((response) => {
        this.handleAuthResponse(response);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        return this.handleError(error);
      }),
    );
  }

  login(data: LoginRequest): Observable<AuthResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, data).pipe(
      tap((response) => {
        this.handleAuthResponse(response);
        this._isLoading.set(false);
      }),
      catchError((error) => {
        this._isLoading.set(false);
        return this.handleError(error);
      }),
    );
  }

  logout(): void {
    const refreshToken = this.refreshToken;
    if (refreshToken) {
      this.http
        .post<MessageResponse>(`${this.apiUrl}/auth/logout`, { refreshToken })
        .subscribe({ error: () => {} });
    }
    this.clearAuth();
    this.router.navigate(['/login']);
  }

  logoutAll(): Observable<MessageResponse> {
    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/logout-all`, {}).pipe(
      tap(() => {
        this.clearAuth();
        this.router.navigate(['/login']);
      }),
      catchError((error) => this.handleError(error)),
    );
  }

  forgotPassword(data: ForgotPasswordRequest): Observable<MessageResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/forgot-password`, data).pipe(
      tap(() => this._isLoading.set(false)),
      catchError((error) => {
        this._isLoading.set(false);
        return this.handleError(error);
      }),
    );
  }

  resetPassword(data: ResetPasswordRequest): Observable<MessageResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/reset-password`, data).pipe(
      tap(() => this._isLoading.set(false)),
      catchError((error) => {
        this._isLoading.set(false);
        return this.handleError(error);
      }),
    );
  }

  verifyEmail(data: VerifyEmailRequest): Observable<MessageResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http.post<MessageResponse>(`${this.apiUrl}/auth/verify-email`, data).pipe(
      tap(() => this._isLoading.set(false)),
      catchError((error) => {
        this._isLoading.set(false);
        return this.handleError(error);
      }),
    );
  }

  resendVerification(data: ResendVerificationRequest): Observable<MessageResponse> {
    this._isLoading.set(true);
    this._error.set(null);

    return this.http
      .post<MessageResponse>(`${this.apiUrl}/auth/resend-verification`, data)
      .pipe(
        tap(() => this._isLoading.set(false)),
        catchError((error) => {
          this._isLoading.set(false);
          return this.handleError(error);
        }),
      );
  }

  getCurrentUser(): Observable<AuthResponse> {
    return this.http
      .get<AuthResponse>(`${this.apiUrl}/auth/me`)
      .pipe(
        tap((response) => {
          this._user.set(response.data as unknown as User);
        }),
        catchError((error) => {
          if (error.status === 401) {
            this.clearAuth();
          }
          return this.handleError(error);
        }),
      );
  }

  refreshAccessToken(): Observable<AuthResponse> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(
        tap((response) => {
          this.storeTokens(response.data.accessToken, response.data.refreshToken);
        }),
        catchError((error) => {
          this.clearAuth();
          return this.handleError(error);
        }),
      );
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this._user();
  }

  hasRole(user: User, role: string): boolean {
    const normalizedRole = role.toUpperCase();
    return user.roles.some((userRole) => {
      const normalizedUserRole = userRole.toUpperCase();
      return (
        normalizedUserRole === normalizedRole ||
        normalizedUserRole === `ROLE_${normalizedRole}`
      );
    });
  }

  getPostLoginRoute(user: User): string {
    const isAdmin = user.roles.some(
      (r) => r.toUpperCase() === 'ADMIN' || r.toUpperCase() === 'SUPER_ADMIN',
    );

    if (isAdmin) {
      return '/admin';
    }

    return '/products';
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.storeTokens(response.data.accessToken, response.data.refreshToken);
    this.storeUser(response.data.user);
    this._user.set(response.data.user);
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private storeUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
  }

  private clearAuth(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this._user.set(null);
    this._error.set(null);
  }

  private loadUserFromStorage(): void {
    const token = this.accessToken;
    const userJson = localStorage.getItem(this.USER_KEY);

    if (token && userJson) {
      try {
        const user = JSON.parse(userJson) as User;
        this._user.set(user);
      } catch {
        this.clearAuth();
      }
    }
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'An unexpected error occurred';

    if (error.error?.message) {
      message = error.error.message;
    } else if (error.message) {
      message = error.message;
    }

    this._error.set(message);
    return throwError(() => error);
  }

  clearError(): void {
    this._error.set(null);
  }
}
