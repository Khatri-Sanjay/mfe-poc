import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from '../admin-sidebar/admin-sidebar.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { AdminRouteService } from '../../core/services/admin-route.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet, AdminSidebarComponent, ToastComponent],
  template: `
    <div class="admin-shell">
      <app-admin-sidebar />
      <div class="admin-main-area">
        <header class="admin-topbar">
          <div class="admin-topbar-left">
            <a class="brand-mark" [routerLink]="adminRoute.link('/dashboard')">
              <span class="brand-icon"><i class="bi bi-grid-1x2-fill"></i></span>
              <div>
                <strong>Admin Panel</strong>
                <small>E-Commerce Store</small>
              </div>
            </a>
          </div>
          <div class="admin-topbar-actions">
            <span class="admin-user-chip">
              <i class="bi bi-person-circle"></i>
              {{ authService.currentUser()?.email || 'Admin' }}
            </span>
          </div>
        </header>
        <main class="admin-panel">
          <router-outlet />
        </main>
      </div>
    </div>
    <app-toast-stack />
  `,
  styles: `
    :host {
      display: block;
      height: 100dvh;
      overflow: hidden;
    }
  `,
})
export class AdminLayoutComponent {
  readonly adminRoute = inject(AdminRouteService);
  readonly authService = inject(AuthService);
}
