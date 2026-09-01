import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterOutlet } from '@angular/router';
import { AdminSidebarComponent } from './admin-sidebar.component';
import { ToastComponent } from '../shared/components/toast/toast.component';
import { AuthService } from '../core/services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterOutlet, AdminSidebarComponent, ToastComponent],
  template: `
    <div class="admin-shell">
      <app-admin-sidebar />
      <div class="admin-main-area">
        <header class="admin-topbar">
          <div class="admin-topbar-left">
            <a class="brand-mark" routerLink="/dashboard">
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
  authService = inject(AuthService);
}
