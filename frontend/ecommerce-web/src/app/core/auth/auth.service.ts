import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../http/api-client.service';
import { AuthResponse, User } from '../models/commerce.models';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  firstName: string;
  lastName: string;
  phone?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);

  login(payload: LoginPayload): Promise<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/login', payload);
  }

  register(payload: RegisterPayload): Promise<AuthResponse> {
    return this.api.post<AuthResponse>('/auth/register', payload);
  }

  refresh(refreshToken: string): Promise<Omit<AuthResponse, 'user'>> {
    return this.api.post<Omit<AuthResponse, 'user'>>('/auth/refresh', { refreshToken });
  }

  logout(refreshToken: string): Promise<void> {
    return this.api.post<void>('/auth/logout', { refreshToken });
  }

  logoutAll(): Promise<void> {
    return this.api.post<void>('/auth/logout-all');
  }

  me(): Promise<User> {
    return this.api.get<User>('/auth/me');
  }

  forgotPassword(email: string): Promise<void> {
    return this.api.post<void>('/auth/forgot-password', { email });
  }

  resetPassword(token: string, newPassword: string): Promise<void> {
    return this.api.post<void>('/auth/reset-password', { token, newPassword });
  }

  verifyEmail(token: string): Promise<void> {
    return this.api.post<void>('/auth/verify-email', { token });
  }

  resendVerification(email: string): Promise<void> {
    return this.api.post<void>('/auth/resend-verification', { email });
  }
}
