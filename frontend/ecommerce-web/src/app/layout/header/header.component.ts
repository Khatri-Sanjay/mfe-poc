import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../state/cart/cart.facade';
import { WishlistFacade } from '../../features/wishlist/wishlist.facade';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="app-header">
      <a class="brand-mark" routerLink="/" aria-label="CommerceOS home">
        <span class="brand-icon"><i class="bi bi-bag-check"></i></span>
        <span>
          <strong>CommerceOS</strong>
          <small>API connected storefront</small>
        </span>
      </a>

      <nav class="desktop-nav" aria-label="Primary navigation">
        <a routerLink="/products" routerLinkActive="active">Shop</a>
        <a routerLink="/wishlist" routerLinkActive="active">Wishlist</a>
        <a routerLink="/orders" routerLinkActive="active">Orders</a>
        @if (auth.hasAnyPermission(['product.read', 'order.read', 'user.read', 'inventory.read'])) {
          <a routerLink="/admin" routerLinkActive="active">Admin</a>
        }
      </nav>

      <div class="header-actions">
        <a class="icon-link" routerLink="/wishlist" aria-label="Wishlist">
          <i class="bi bi-heart"></i>
          <span>{{ wishlist.items().length }}</span>
        </a>
        <a class="icon-link" routerLink="/cart" aria-label="Cart">
          <i class="bi bi-cart3"></i>
          <span>{{ cart.itemCount() }}</span>
        </a>
        @if (auth.isAuthenticated()) {
          <a class="account-chip" routerLink="/account/profile">
            <i class="bi bi-person-circle"></i>
            {{ auth.currentUser()?.firstName }}
          </a>
          <button class="btn-secondary compact" type="button" (click)="auth.logout()">Logout</button>
        } @else {
          <a class="btn-primary compact" routerLink="/auth/login">Sign in</a>
        }
      </div>
    </header>
  `,
})
export class HeaderComponent {
  readonly auth = inject(AuthFacade);
  readonly cart = inject(CartFacade);
  readonly wishlist = inject(WishlistFacade);
}
