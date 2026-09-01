import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { map, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginRequest, ApiResponse, AuthData, User } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ACCESS_TOKEN = 'access_token';
  private readonly REFRESH_TOKEN = 'refresh_token';
  private readonly AUTH_USER = 'auth_user';

  currentUser = signal<User | null>(this.loadUser());
  isAuthenticated = computed(() => !!this.currentUser() && !!this.getAccessToken());
  isAdmin = computed(() => this.currentUser()?.roles?.includes('ADMIN') ?? false);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  login(credentials: LoginRequest) {
    return this.http
      .post<ApiResponse<AuthData>>(`${environment.apiUrl}/auth/login`, credentials)
      .pipe(
        map((res) => res.data),
        tap((data) => this.setSession(data)),
      );
  }

  logout() {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN);
    if (refreshToken) {
      this.http.post(`${environment.apiUrl}/auth/logout`, { refreshToken }).subscribe();
    }
    this.clearSession();
    this.notifyShellLogout();
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN);
  }

  refreshAuth() {
    const refreshToken = localStorage.getItem(this.REFRESH_TOKEN);
    if (!refreshToken) {
      this.clearSession();
      return;
    }
    this.http
      .post<ApiResponse<AuthData>>(`${environment.apiUrl}/auth/refresh`, { refreshToken })
      .pipe(map((res) => res.data))
      .subscribe({
        next: (data) => this.setSession(data),
        error: () => this.clearSession(),
      });
  }

  private setSession(data: AuthData) {
    localStorage.setItem(this.ACCESS_TOKEN, data.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN, data.refreshToken);
    localStorage.setItem(this.AUTH_USER, JSON.stringify(data.user));
    this.currentUser.set(data.user);
  }

  private clearSession() {
    localStorage.removeItem(this.ACCESS_TOKEN);
    localStorage.removeItem(this.REFRESH_TOKEN);
    localStorage.removeItem(this.AUTH_USER);
    this.currentUser.set(null);
  }

  private notifyShellLogout() {
    window.dispatchEvent(new CustomEvent('commerce-auth-logout'));
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(this.AUTH_USER);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
}
