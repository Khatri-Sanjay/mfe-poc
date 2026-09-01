import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <div class="auth-card">
        <div class="login-header">
          <span class="brand-icon"><i class="bi bi-grid-1x2-fill"></i></span>
          <h1>Admin Login</h1>
          <p>Sign in to manage your store</p>
        </div>
        <form (ngSubmit)="onSubmit()">
          <label>
            Email
            <input type="email" [(ngModel)]="email" name="email" required email placeholder="admin@example.com" />
          </label>
          <label>
            Password
            <div class="password-field">
              <input [type]="showPassword() ? 'text' : 'password'" [(ngModel)]="password" name="password" required placeholder="Enter your password" />
              <button type="button" class="password-toggle" (click)="showPassword.set(!showPassword())">
                <i class="bi" [class.bi-eye]="!showPassword()" [class.bi-eye-slash]="showPassword()"></i>
              </button>
            </div>
          </label>
          <button type="submit" class="btn-primary" [disabled]="loading()">
            @if (loading()) {
              <span>Signing in...</span>
            } @else {
              <span>Sign In</span>
            }
          </button>
        </form>
      </div>
    </div>
  `,
  styles: `
    .login-page {
      min-height: 100dvh;
      display: grid;
      place-items: center;
      background: var(--color-background);
      padding: 1rem;
    }
    .auth-card {
      width: 100%;
      max-width: 24rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-md);
      padding: 2rem;
    }
    .login-header {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .login-header .brand-icon {
      display: inline-grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), #24786d);
      color: #fff;
      font-size: 1.2rem;
      margin-bottom: 1rem;
    }
    .login-header h1 {
      font-size: 1.5rem;
      margin-bottom: 0.25rem;
    }
    .login-header p {
      color: var(--color-text-muted);
      font-size: 0.9rem;
    }
    form {
      display: grid;
      gap: 1rem;
    }
    .btn-primary {
      width: 100%;
      min-height: 2.75rem;
    }
  `,
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  email = '';
  password = '';
  loading = signal(false);
  showPassword = signal(false);

  onSubmit() {
    if (!this.email || !this.password) return;
    this.loading.set(true);
    this.authService.login({ email: this.email, password: this.password }).subscribe({
      next: () => {
        this.toast.success('Welcome back', 'You have been signed in successfully.');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.loading.set(false);
        this.toast.error('Login failed', err.error?.message || 'Invalid credentials.');
      },
    });
  }
}
