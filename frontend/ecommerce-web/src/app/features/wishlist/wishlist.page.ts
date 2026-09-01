import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CartFacade } from '../../state/cart/cart.facade';
import { CatalogService } from '../catalog/catalog.service';
import { WishlistFacade } from './wishlist.facade';

@Component({
  standalone: true,
  imports: [RouterLink, EmptyStateComponent],
  template: `
    <section class="surface">
      <div class="section-heading compact"><h1>Wishlist</h1></div>
      <div class="wishlist-grid">
        @for (item of wishlist.items(); track item.productId) {
          <article class="saved-card">
            <img [src]="item.imageUrl || fallback" [alt]="item.name" />
            <div><strong>{{ item.name }}</strong><span>{{ item.slug }}</span></div>
            <a class="btn-secondary" [routerLink]="['/products', item.slug]">View</a>
            <button class="btn-primary" type="button" (click)="moveToCart(item.slug, item.productId)">Move to cart</button>
            <button class="icon-btn danger" type="button" aria-label="Remove wishlist item" (click)="remove(item.productId)"><i class="bi bi-heartbreak"></i></button>
          </article>
        } @empty {
          <app-empty-state title="No saved products" message="Save products from the catalog to compare later.">
            <a class="btn-primary mt-3" routerLink="/products">Browse products</a>
          </app-empty-state>
        }
      </div>
    </section>
  `,
})
export class WishlistPage implements OnInit {
  readonly wishlist = inject(WishlistFacade);
  private readonly cart = inject(CartFacade);
  private readonly catalog = inject(CatalogService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly fallback = 'https://placehold.co/300x240/f4f7f6/19302d?text=Product';

  ngOnInit(): void {
    void this.wishlist.load();
  }

  async remove(productId: string): Promise<void> {
    if (await this.confirmDialog.confirm('Remove saved product', 'Remove this product from your wishlist?', 'Remove')) {
      await this.wishlist.remove(productId);
    }
  }

  async moveToCart(slug: string, productId: string): Promise<void> {
    const product = await this.catalog.productBySlug(slug);
    await this.cart.addProduct(product);
    await this.wishlist.remove(productId);
  }
}
