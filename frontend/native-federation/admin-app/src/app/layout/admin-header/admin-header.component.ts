import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminRouteService } from '../../core/services/admin-route.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-header',
  imports: [RouterLink],
  template: `
    <header class="app-header">
      <a class="brand-mark" [routerLink]="adminRoute.link('/dashboard')">
        <span class="brand-icon"><i class="bi bi-grid-1x2-fill"></i></span>
        <div>
          <strong>Admin</strong>
          <small>E-Commerce</small>
        </div>
      </a>
      <div class="header-actions">
        <span class="account-chip">
          <i class="bi bi-person-circle"></i>
          {{ authService.currentUser()?.firstName }}
        </span>
        <button class="btn-secondary compact" (click)="authService.logout()">
          <i class="bi bi-box-arrow-left"></i> Logout
        </button>
      </div>
    </header>
  `,

  styles: `
    :host {
      display: block;
    }
  `,
})
export class AdminHeaderComponent {
  readonly adminRoute = inject(AdminRouteService);
  readonly authService = inject(AuthService);
}
