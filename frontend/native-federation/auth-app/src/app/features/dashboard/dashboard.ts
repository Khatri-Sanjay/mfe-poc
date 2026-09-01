import { Component, inject } from '@angular/core';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-dashboard',
  template: `
    <div class="dashboard">
      <header class="app-header">
        <a class="brand-mark" href="/">
          <span class="brand-icon"><i class="bi bi-bag-check"></i></span>
          <strong>ShopFlow</strong>
        </a>
        <div class="header-actions">
          <span class="user-chip">
            <i class="bi bi-person"></i>
            {{ user()?.firstName }} {{ user()?.lastName }}
          </span>
          <button class="btn-secondary compact" type="button" (click)="logout()">
            <i class="bi bi-box-arrow-right"></i> Logout
          </button>
        </div>
      </header>

      <main class="page-shell">
        <section class="welcome-card">
          <p class="eyebrow">Dashboard</p>
          <h1>Welcome, {{ user()?.firstName }}!</h1>
          <p class="muted">You are signed in as <strong>{{ user()?.email }}</strong></p>

          <div class="user-details">
            <div class="detail-item">
              <span class="detail-label">Status</span>
              <span class="detail-value status-active">
                <i class="bi bi-check-circle-fill"></i>
                {{ user()?.status }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Email Verified</span>
              <span class="detail-value" [class.verified]="user()?.emailVerified">
                <i [class]="user()?.emailVerified ? 'bi bi-check-circle-fill' : 'bi bi-x-circle-fill'"></i>
                {{ user()?.emailVerified ? 'Yes' : 'No' }}
              </span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Roles</span>
              <span class="detail-value">{{ user()?.roles?.join(', ') }}</span>
            </div>
          </div>
        </section>
      </main>
    </div>
  `,
  styles: `
    .dashboard {
      min-height: 100dvh;
    }

    .app-header {
      position: sticky;
      top: 0;
      z-index: 30;
      display: flex;
      align-items: center;
      gap: 1rem;
      border-bottom: 1px solid rgba(18, 71, 63, 0.12);
      background: rgba(255, 255, 255, 0.96);
      padding: 0.85rem max(1.25rem, calc((100vw - 1480px) / 2 + 1.25rem));
      backdrop-filter: blur(12px);
    }

    .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 0.7rem;
      min-width: max-content;
    }

    .brand-icon {
      display: grid;
      width: 2.35rem;
      height: 2.35rem;
      place-items: center;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), #24786d);
      color: #fff;
    }

    .brand-mark strong {
      display: block;
      line-height: 1.1;
      font-weight: 950;
      font-size: 1.1rem;
      color: var(--color-text-primary);
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      margin-left: auto;
    }

    .user-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      padding: 0.55rem 0.72rem;
      font-weight: 800;
      font-size: 0.85rem;
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.45rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: #fff;
      color: var(--color-primary);
      min-height: 2.1rem;
      padding: 0.42rem 0.7rem;
      font-weight: 850;
      font-size: 0.85rem;
      line-height: 1.1;
      cursor: pointer;
      transition: background 0.15s;
    }

    .btn-secondary:hover {
      background: var(--color-surface-muted);
      color: var(--color-primary);
    }

    .page-shell {
      min-height: calc(100dvh - 9rem);
      max-width: 1480px;
      margin: 0 auto;
      padding: 1.25rem;
    }

    .welcome-card {
      max-width: 42rem;
      margin: 2rem auto;
      padding: 2.5rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: var(--color-surface);
      box-shadow: var(--shadow-md);
    }

    .welcome-card h1 {
      font-size: clamp(1.8rem, 4vw, 3rem);
      line-height: 1.05;
      font-weight: 950;
      margin-bottom: 0.5rem;
    }

    .muted {
      color: var(--color-text-muted);
      font-size: 0.92rem;
      line-height: 1.55;
    }

    .user-details {
      display: flex;
      justify-content: center;
      gap: 3rem;
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid var(--color-border);
    }

    .detail-item {
      text-align: center;
    }

    .detail-label {
      display: block;
      font-size: 0.78rem;
      font-weight: 750;
      color: var(--color-text-muted);
      margin-bottom: 0.375rem;
    }

    .detail-value {
      font-weight: 900;
      color: var(--color-text-primary);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .status-active,
    .verified {
      color: var(--color-success);
    }

    @media (max-width: 640px) {
      .app-header {
        flex-direction: column;
        gap: 0.75rem;
      }

      .header-actions {
        margin-left: 0;
      }

      .user-details {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `,
})
export class Dashboard {
  private readonly authService = inject(AuthService);
  readonly user = this.authService.user;

  logout(): void {
    this.authService.logout();
  }
}
