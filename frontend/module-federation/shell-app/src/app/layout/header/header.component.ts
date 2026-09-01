import { Component, inject, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../features/cart/cart.facade';
import { WishlistFacade } from '../../features/wishlist/wishlist.facade';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, ReactiveFormsModule, FormsModule],
  template: `
    <header class="app-header">
      <div class="header-left">
        <a class="brand-mark" routerLink="/" aria-label="CommerceOS home">
          <span class="brand-icon"><i class="bi bi-bag-check"></i></span>
          <span class="brand-text">
            <strong>CommerceOS</strong>
            <small>API connected storefront</small>
          </span>
        </a>
      </div>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <a routerLink="/products" routerLinkActive="active">Shop</a>
        <a routerLink="/wishlist" routerLinkActive="active">Wishlist</a>
        @if (auth.isAuthenticated()) {
          <a routerLink="/orders" routerLinkActive="active">Orders</a>
        }
        @if (auth.hasAnyPermission(['product.read', 'order.read', 'user.read', 'inventory.read'])) {
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
        }
      </nav>

      <div class="header-search">
        <form (ngSubmit)="search()">
          <i class="bi bi-search"></i>
          <input
            [formControl]="searchControl"
            type="text"
            placeholder="Search products..."
            aria-label="Search products"
          />
        </form>
      </div>

      <div class="header-actions">
        <a class="icon-link" routerLink="/wishlist" aria-label="Wishlist">
          <i class="bi bi-heart"></i>
          @if (wishlist.items().length > 0) {
            <span class="badge">{{ wishlist.items().length }}</span>
          }
        </a>
        <a class="icon-link" routerLink="/cart" aria-label="Cart">
          <i class="bi bi-cart3"></i>
          @if (cart.itemCount() > 0) {
            <span class="badge">{{ cart.itemCount() }}</span>
          }
        </a>

        <div class="header-divider"></div>

        @if (auth.isAuthenticated()) {
          <div class="account-menu" (click)="accountOpen.set(!accountOpen())">
            <button class="account-chip" type="button">
              <i class="bi bi-person-circle"></i>
              <span class="account-name">{{ auth.currentUser()?.firstName }}</span>
              <i class="bi bi-chevron-down account-chevron"></i>
            </button>
            @if (accountOpen()) {
              <div class="account-dropdown">
                <div class="account-dropdown-header">
                  <i class="bi bi-person-circle"></i>
                  <div>
                    <strong
                      >{{ auth.currentUser()?.firstName }}
                      {{ auth.currentUser()?.lastName }}</strong
                    >
                    <small>{{ auth.currentUser()?.email }}</small>
                  </div>
                </div>
                <div class="account-dropdown-divider"></div>
                <a
                  class="account-dropdown-item"
                  routerLink="/auth/dashboard"
                  (click)="accountOpen.set(false)"
                >
                  <i class="bi bi-person"></i> My Profile
                </a>
                <a
                  class="account-dropdown-item"
                  routerLink="/orders"
                  (click)="accountOpen.set(false)"
                >
                  <i class="bi bi-box-seam"></i> My Orders
                </a>
                <a
                  class="account-dropdown-item"
                  routerLink="/wishlist"
                  (click)="accountOpen.set(false)"
                >
                  <i class="bi bi-heart"></i> Wishlist
                </a>
                @if (
                  auth.hasAnyPermission([
                    'product.read',
                    'order.read',
                    'user.read',
                    'inventory.read',
                  ])
                ) {
                  <a
                    class="account-dropdown-item"
                    routerLink="/admin"
                    (click)="accountOpen.set(false)"
                  >
                    <i class="bi bi-speedometer2"></i> Admin Panel
                  </a>
                }
                <div class="account-dropdown-divider"></div>
                <button class="account-dropdown-item danger" type="button" (click)="logout()">
                  <i class="bi bi-box-arrow-right"></i> Sign out
                </button>
              </div>
            }
          </div>
        } @else {
          <a class="btn-primary compact" routerLink="/auth/login">
            <i class="bi bi-box-arrow-in-right"></i> Sign in
          </a>
        }

        <button
          class="mobile-menu-btn"
          type="button"
          (click)="mobileOpen.set(!mobileOpen())"
          aria-label="Menu"
        >
          <i [class]="mobileOpen() ? 'bi bi-x-lg' : 'bi bi-list'"></i>
        </button>
      </div>
    </header>

    @if (mobileOpen()) {
      <div class="mobile-overlay" (click)="mobileOpen.set(false)"></div>
      <div class="mobile-drawer">
        <div class="mobile-drawer-header">
          <a class="brand-mark" routerLink="/" (click)="mobileOpen.set(false)">
            <span class="brand-icon"><i class="bi bi-bag-check"></i></span>
            <span class="brand-text">
              <strong>CommerceOS</strong>
              <small>Storefront</small>
            </span>
          </a>
          <button
            class="icon-btn"
            type="button"
            (click)="mobileOpen.set(false)"
            aria-label="Close menu"
          >
            <i class="bi bi-x-lg"></i>
          </button>
        </div>

        <div class="mobile-drawer-search">
          <form (ngSubmit)="search(); mobileOpen.set(false)">
            <i class="bi bi-search"></i>
            <input
              [formControl]="searchControl"
              type="text"
              placeholder="Search products..."
              aria-label="Search products"
            />
          </form>
        </div>

        <nav class="mobile-drawer-nav" aria-label="Mobile navigation">
          <a routerLink="/products" (click)="mobileOpen.set(false)"
            ><i class="bi bi-grid-3x3-gap"></i> Shop</a
          >
          <a routerLink="/wishlist" (click)="mobileOpen.set(false)"
            ><i class="bi bi-heart"></i> Wishlist</a
          >
          @if (auth.isAuthenticated()) {
            <a routerLink="/orders" (click)="mobileOpen.set(false)"
              ><i class="bi bi-box-seam"></i> Orders</a
            >
          }
          <a routerLink="/cart" (click)="mobileOpen.set(false)"><i class="bi bi-cart3"></i> Cart</a>
          @if (
            auth.hasAnyPermission(['product.read', 'order.read', 'user.read', 'inventory.read'])
          ) {
            <a routerLink="/admin" (click)="mobileOpen.set(false)"
              ><i class="bi bi-speedometer2"></i> Admin</a
            >
          }
        </nav>

        <div class="mobile-drawer-footer">
          @if (auth.isAuthenticated()) {
            <div class="mobile-drawer-user">
              <i class="bi bi-person-circle"></i>
              <div>
                <strong
                  >{{ auth.currentUser()?.firstName }} {{ auth.currentUser()?.lastName }}</strong
                >
                <small>{{ auth.currentUser()?.email }}</small>
              </div>
            </div>
            <button
              class="btn-secondary w-full"
              type="button"
              (click)="logout(); mobileOpen.set(false)"
            >
              <i class="bi bi-box-arrow-right"></i> Sign out
            </button>
          } @else {
            <a class="btn-primary w-full" routerLink="/auth/login" (click)="mobileOpen.set(false)">
              <i class="bi bi-box-arrow-in-right"></i> Sign in
            </a>
          }
        </div>
      </div>
    }
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthFacade);
  readonly cart = inject(CartFacade);
  readonly wishlist = inject(WishlistFacade);
  private readonly router = inject(Router);

  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly accountOpen = signal(false);
  readonly mobileOpen = signal(false);

  search(): void {
    const query = this.searchControl.value.trim();
    if (query) {
      this.router.navigate(['/products'], { queryParams: { search: query } });
    } else {
      this.router.navigate(['/products']);
    }
  }

  async logout(): Promise<void> {
    this.accountOpen.set(false);
    await this.auth.logout();
  }
}
