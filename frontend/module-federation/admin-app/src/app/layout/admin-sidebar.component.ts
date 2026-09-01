import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside class="admin-sidebar">
      <div class="brand-mark">
        <div class="brand-icon">
          <i class="bi bi-bag-check-fill"></i>
        </div>

        <div>
          <strong>YourStore</strong>
          <small>Administration</small>
        </div>
      </div>

      <nav class="admin-nav" aria-label="Admin navigation">
        <a
          routerLink="/admin/dashboard"
          routerLinkActive="active"
          [routerLinkActiveOptions]="{ exact: true }"
        >
          <i class="bi bi-speedometer2"></i>
          <span>Dashboard</span>
        </a>
        <a routerLink="/admin/products" routerLinkActive="active">
          <i class="bi bi-box-seam"></i>
          <span>Products</span>
        </a>
        <a routerLink="/admin/categories" routerLinkActive="active">
          <i class="bi bi-tags"></i>
          <span>Categories</span>
        </a>
        <a routerLink="/admin/brands" routerLinkActive="active">
          <i class="bi bi-award"></i>
          <span>Brands</span>
        </a>
        <a routerLink="/admin/orders" routerLinkActive="active">
          <i class="bi bi-receipt"></i>
          <span>Orders</span>
        </a>
        <a routerLink="/admin/users" routerLinkActive="active">
          <i class="bi bi-people"></i>
          <span>Users</span>
        </a>
        <a routerLink="/admin/reviews" routerLinkActive="active">
          <i class="bi bi-star"></i>
          <span>Reviews</span>
        </a>
        <a routerLink="/admin/inventory" routerLinkActive="active">
          <i class="bi bi-boxes"></i>
          <span>Inventory</span>
        </a>
        <a routerLink="/admin/coupons" routerLinkActive="active">
          <i class="bi bi-percent"></i>
          <span>Coupons</span>
        </a>
        <a routerLink="/admin/shipping" routerLinkActive="active">
          <i class="bi bi-truck"></i>
          <span>Shipping</span>
        </a>
        <a routerLink="/admin/seed-data" routerLinkActive="active">
          <i class="bi bi-database-fill-add"></i>
          <span>Seed Data</span>
        </a>
      </nav>
      <button type="button" class="admin-logout" (click)="authService.logout()">
        <i class="bi bi-box-arrow-left"></i>
        <span>Logout</span>
      </button>
    </aside>
  `,
  styles: `
    :host {
      display: block;
    }
  `,
})
export class AdminSidebarComponent {
  authService = inject(AuthService);
}
