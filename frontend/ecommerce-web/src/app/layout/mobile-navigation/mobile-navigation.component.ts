import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../state/cart/cart.facade';

@Component({
  selector: 'app-mobile-navigation',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <nav class="mobile-nav" aria-label="Mobile navigation">
      <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"><i class="bi bi-house"></i><span>Home</span></a>
      <a routerLink="/products" routerLinkActive="active"><i class="bi bi-grid"></i><span>Shop</span></a>
      <a routerLink="/wishlist" routerLinkActive="active"><i class="bi bi-heart"></i><span>Saved</span></a>
      <a routerLink="/cart" routerLinkActive="active"><i class="bi bi-cart3"></i><span>Cart {{ cart.itemCount() }}</span></a>
      <a [routerLink]="auth.isAuthenticated() ? '/account/profile' : '/auth/login'" routerLinkActive="active"><i class="bi bi-person"></i><span>Account</span></a>
    </nav>
  `,
})
export class MobileNavigationComponent {
  readonly auth = inject(AuthFacade);
  readonly cart = inject(CartFacade);
}
