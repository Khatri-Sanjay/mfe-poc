import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { AdminResource, AdminService } from './admin.service';

@Component({
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <section class="admin-frame">
      <aside class="admin-sidebar" aria-label="Admin navigation">
        <div class="admin-brand">
          <span class="admin-brand-icon"><i class="bi bi-grid-1x2"></i></span>
          <div>
            <strong>Commerce Admin</strong>
            <small>Operations console</small>
          </div>
        </div>

        <nav class="admin-nav">
          <a routerLink="/admin" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">
            <i class="bi bi-speedometer2"></i>
            <span>Dashboard</span>
          </a>
          @for (resource of service.resources; track resource.key) {
            @if (auth.hasAnyPermission(resource.permissions)) {
              <a [routerLink]="['/admin', resource.key]" routerLinkActive="active">
                <i [class]="resourceIcon(resource.key)"></i>
                <span>{{ resource.title }}</span>
              </a>
            }
          }
        </nav>
      </aside>

      <div class="admin-panel">
        <header class="admin-topbar">
          <div>
            <p class="eyebrow">Admin</p>
            <h1>Back office</h1>
          </div>
          <div class="admin-topbar-actions">
            <a class="btn-secondary compact" routerLink="/products"><i class="bi bi-shop"></i> Storefront</a>
            <a class="btn-primary compact" routerLink="/admin"><i class="bi bi-speedometer2"></i> Dashboard</a>
          </div>
        </header>

        <router-outlet />
      </div>
    </section>
  `,
})
export class AdminLayoutComponent {
  readonly service = inject(AdminService);
  readonly auth = inject(AuthFacade);

  resourceIcon(key: AdminResource): string {
    const icons: Record<AdminResource, string> = {
      dashboard: 'bi bi-speedometer2',
      users: 'bi bi-people',
      products: 'bi bi-box-seam',
      categories: 'bi bi-diagram-3',
      brands: 'bi bi-award',
      inventory: 'bi bi-boxes',
      orders: 'bi bi-receipt',
      refunds: 'bi bi-arrow-counterclockwise',
      coupons: 'bi bi-ticket-perforated',
      shipping: 'bi bi-truck',
      reviews: 'bi bi-star',
    };
    return icons[key] ?? 'bi bi-gear';
  }
}
