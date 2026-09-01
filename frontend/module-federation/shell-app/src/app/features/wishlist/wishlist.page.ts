import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { WishlistFacade } from '../wishlist/wishlist.facade';
import { AuthFacade } from '../../state/auth/auth.facade';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-wishlist',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Saved</p>
          <h1>My Wishlist</h1>
        </div>
      </div>
      @if (!auth.isAuthenticated()) {
        <app-empty-state title="Sign in required" message="Please sign in to view your wishlist.">
          <a class="btn-primary" routerLink="/auth/login">Sign in</a>
        </app-empty-state>
      } @else if (wishlist.items().length === 0) {
        <app-empty-state title="Wishlist is empty" message="Save products you love to revisit them later.">
          <a class="btn-secondary" routerLink="/products">Browse products</a>
        </app-empty-state>
      } @else {
        <div class="product-grid">
          @for (item of wishlist.items(); track item.productId) {
            <a class="product-card" [routerLink]="['/products', item.slug]">
              <img [src]="item.imageUrl || 'https://placehold.co/900x700/f4f7f6/19302d?text=Product'" [alt]="item.name" />
              <div>
                <strong>{{ item.name }}</strong>
              </div>
            </a>
          }
        </div>
      }
    </section>
  `,
})
export class WishlistPage {
  readonly auth = inject(AuthFacade);
  readonly wishlist = inject(WishlistFacade);
}
