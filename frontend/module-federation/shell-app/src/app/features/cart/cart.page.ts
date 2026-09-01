import { Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { CartItem } from '../../core/models/commerce.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CartFacade } from './cart.facade';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [RouterLink, EmptyStateComponent, MoneyPipe],
  template: `
    <section class="cart-page">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Shopping</p>
          <h1>My Cart</h1>
          @if (auth.isAuthenticated() && cart.itemCount() > 0) {
            <p class="cart-count">{{ cart.itemCount() }} item{{ cart.itemCount() === 1 ? '' : 's' }} ready for checkout</p>
          }
        </div>
        @if (auth.isAuthenticated() && cart.itemCount() > 0) {
          <button class="btn-secondary compact" type="button" [disabled]="cart.loading()" (click)="reload()">
            <i class="bi bi-arrow-repeat"></i>
            Refresh
          </button>
        }
      </div>

      @if (!auth.isAuthenticated()) {
        <app-empty-state title="Sign in required" message="Please sign in to view and manage your cart.">
          <a class="btn-primary" routerLink="/auth/login" [queryParams]="{ returnUrl: '/cart' }">
            <i class="bi bi-box-arrow-in-right"></i>
            Sign in
          </a>
        </app-empty-state>
      } @else if (cart.loading() && cart.itemCount() === 0) {
        <div class="cart-skeleton" aria-label="Loading cart">
          @for (item of [1, 2, 3]; track item) {
            <span></span>
          }
        </div>
      } @else if (cart.itemCount() === 0) {
        <app-empty-state title="Cart is empty" message="Add products to your cart to get started.">
          <a class="btn-secondary" routerLink="/products">
            <i class="bi bi-grid-3x3-gap"></i>
            Browse products
          </a>
        </app-empty-state>
      } @else {
        <div class="cart-layout">
          <div class="cart-items surface">
            <div class="cart-panel-header">
              <h2>Items</h2>
              <button class="link-button danger-text" type="button" [disabled]="cart.loading()" (click)="clearCart()">
                <i class="bi bi-trash3"></i>
                Clear cart
              </button>
            </div>

            @for (item of cart.items(); track item.id) {
              <article class="cart-item">
                <a class="item-image" [routerLink]="['/products', item.slug]" [attr.aria-label]="item.productName">
                  <img [src]="image(item)" [alt]="item.productName" (error)="useFallbackImage($event)" />
                </a>

                <div class="item-main">
                  <div class="item-title-row">
                    <div>
                      <a class="item-title" [routerLink]="['/products', item.slug]">{{ item.productName }}</a>
                      <p class="item-meta">
                        <span>SKU {{ item.sku }}</span>
                        @if (optionLabel(item)) {
                          <span>{{ optionLabel(item) }}</span>
                        }
                      </p>
                    </div>
                    <strong class="item-total">{{ item.lineTotal | money:cart.cart().currency }}</strong>
                  </div>

                  <div class="item-controls">
                    <div class="quantity-control" aria-label="Quantity">
                      <button
                        type="button"
                        [disabled]="cart.loading() || item.quantity <= 1"
                        (click)="decrement(item)"
                        aria-label="Decrease quantity"
                      >
                        <i class="bi bi-dash"></i>
                      </button>
                      <input
                        type="number"
                        min="1"
                        [value]="item.quantity"
                        [disabled]="cart.loading()"
                        (change)="setQuantity(item, $event)"
                        aria-label="Item quantity"
                      />
                      <button
                        type="button"
                        [disabled]="cart.loading()"
                        (click)="increment(item)"
                        aria-label="Increase quantity"
                      >
                        <i class="bi bi-plus"></i>
                      </button>
                    </div>

                    <span class="unit-price">{{ item.unitPrice | money:cart.cart().currency }} each</span>

                    <button class="link-button danger-text" type="button" [disabled]="cart.loading()" (click)="remove(item)">
                      <i class="bi bi-x-circle"></i>
                      Remove
                    </button>
                  </div>
                </div>
              </article>
            }
          </div>

          <aside class="cart-summary surface" aria-label="Cart summary">
            <h2>Summary</h2>

            <div class="summary-rows">
              <div>
                <span>Subtotal</span>
                <strong>{{ cart.cart().subtotal | money:cart.cart().currency }}</strong>
              </div>
              <div>
                <span>Discount</span>
                <strong [class.discount-value]="hasDiscount()">
                  -{{ cart.cart().discountTotal | money:cart.cart().currency }}
                </strong>
              </div>
              <div>
                <span>Shipping</span>
                <strong>{{ cart.cart().shippingTotal | money:cart.cart().currency }}</strong>
              </div>
              <div>
                <span>Tax</span>
                <strong>{{ cart.cart().taxTotal | money:cart.cart().currency }}</strong>
              </div>
              <div class="summary-total">
                <span>Total</span>
                <strong>{{ cart.cart().grandTotal | money:cart.cart().currency }}</strong>
              </div>
            </div>

            <form class="coupon-form" (submit)="applyCoupon($event)">
              <label for="coupon-code">Coupon code</label>
              <div class="coupon-row">
                <input
                  id="coupon-code"
                  type="text"
                  autocomplete="off"
                  [value]="couponCode()"
                  [disabled]="cart.loading()"
                  (input)="couponCode.set(inputValue($event).toUpperCase())"
                  placeholder="SAVE10"
                />
                <button class="btn-secondary compact" type="submit" [disabled]="cart.loading() || !couponCode().trim()">
                  Apply
                </button>
              </div>
              @if (hasDiscount()) {
                <button class="link-button" type="button" [disabled]="cart.loading()" (click)="removeCoupon()">
                  Remove coupon
                </button>
              }
            </form>

            <button class="btn-primary w-full" type="button" [disabled]="cart.loading()" (click)="startCheckout()">
              <i class="bi bi-credit-card"></i>
              Proceed to checkout
            </button>
            <a class="btn-secondary w-full" routerLink="/products">
              <i class="bi bi-arrow-left"></i>
              Continue shopping
            </a>
          </aside>
        </div>
      }
    </section>
  `,
  styles: `
    :host {
      display: block;
    }

    .cart-page {
      margin-top: 1.25rem;
    }

    .cart-count {
      margin: 0.35rem 0 0;
      color: var(--color-text-muted);
      font-size: 0.94rem;
      font-weight: 700;
    }

    .cart-layout {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 24rem;
      gap: 1.25rem;
      align-items: start;
    }

    .cart-panel-header,
    .item-title-row,
    .item-controls,
    .summary-rows div,
    .coupon-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cart-panel-header {
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .cart-panel-header h2,
    .cart-summary h2 {
      margin: 0;
      font-size: 1.1rem;
    }

    .cart-items {
      display: grid;
      gap: 0.25rem;
    }

    .cart-item {
      display: grid;
      grid-template-columns: 7.5rem minmax(0, 1fr);
      gap: 1rem;
      padding: 1rem 0;
      border-top: 1px solid var(--color-border);
    }

    .cart-item:first-of-type {
      border-top: 0;
    }

    .item-image {
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-muted);
    }

    .item-image img {
      display: block;
      width: 100%;
      aspect-ratio: 1;
      object-fit: cover;
    }

    .item-main {
      display: grid;
      gap: 0.85rem;
      min-width: 0;
    }

    .item-title-row {
      align-items: start;
      justify-content: space-between;
    }

    .item-title {
      display: inline-block;
      color: var(--color-text-primary);
      font-weight: 900;
      line-height: 1.25;
    }

    .item-title:hover {
      color: var(--color-primary);
    }

    .item-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
      margin: 0.35rem 0 0;
      color: var(--color-text-muted);
      font-size: 0.8rem;
      font-weight: 700;
    }

    .item-meta span {
      border-radius: 999px;
      background: var(--color-surface-muted);
      padding: 0.18rem 0.48rem;
    }

    .item-total {
      white-space: nowrap;
      font-size: 1.05rem;
    }

    .item-controls {
      flex-wrap: wrap;
      justify-content: space-between;
    }

    .quantity-control {
      display: inline-grid;
      grid-template-columns: 2.35rem 3.25rem 2.35rem;
      overflow: hidden;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: #fff;
    }

    .quantity-control button,
    .quantity-control input {
      min-width: 0;
      height: 2.35rem;
      border: 0;
      border-radius: 0;
      background: transparent;
      text-align: center;
      padding: 0;
    }

    .quantity-control button {
      display: grid;
      place-items: center;
      color: var(--color-primary);
      cursor: pointer;
    }

    .quantity-control button:hover:not(:disabled) {
      background: var(--color-surface-muted);
    }

    .quantity-control input {
      border-inline: 1px solid var(--color-border);
      font-weight: 900;
      -moz-appearance: textfield;
    }

    .quantity-control input::-webkit-outer-spin-button,
    .quantity-control input::-webkit-inner-spin-button {
      margin: 0;
      -webkit-appearance: none;
    }

    .unit-price {
      color: var(--color-text-muted);
      font-size: 0.84rem;
      font-weight: 700;
    }

    .cart-summary {
      position: sticky;
      top: 5rem;
      display: grid;
      gap: 1rem;
    }

    .summary-rows {
      display: grid;
      gap: 0.7rem;
    }

    .summary-rows div {
      justify-content: space-between;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    .summary-rows strong {
      color: var(--color-text-primary);
      font-weight: 900;
    }

    .summary-rows .discount-value {
      color: var(--color-success);
    }

    .summary-total {
      margin-top: 0.25rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--color-border);
      font-size: 1.05rem !important;
    }

    .summary-total strong {
      font-size: 1.3rem;
    }

    .coupon-form {
      display: grid;
      gap: 0.55rem;
      padding-block: 1rem;
      border-block: 1px solid var(--color-border);
    }

    .coupon-form label {
      font-size: 0.78rem;
      text-transform: uppercase;
    }

    .coupon-row input {
      min-width: 0;
      text-transform: uppercase;
    }

    .coupon-row button {
      flex-shrink: 0;
    }

    .danger-text {
      color: var(--color-danger) !important;
    }

    .cart-skeleton {
      display: grid;
      gap: 0.75rem;
    }

    .cart-skeleton span {
      display: block;
      min-height: 8rem;
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, #eef3f1, #f8faf9, #eef3f1);
      background-size: 200% 100%;
      animation: skeleton 1.3s infinite;
    }

    @media (max-width: 980px) {
      .cart-layout {
        grid-template-columns: 1fr;
      }

      .cart-summary {
        position: static;
      }
    }

    @media (max-width: 640px) {
      .cart-item {
        grid-template-columns: 5.5rem minmax(0, 1fr);
        gap: 0.75rem;
      }

      .item-title-row {
        display: grid;
      }

      .item-total {
        font-size: 0.96rem;
      }

      .item-controls {
        align-items: start;
        display: grid;
        justify-content: stretch;
      }

      .quantity-control {
        width: max-content;
      }

      .coupon-row {
        display: grid;
      }
    }
  `,
})
export class CartPage implements OnInit {
  private readonly fallbackImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="640" viewBox="0 0 640 640"%3E%3Crect width="640" height="640" fill="%23edf4f1"/%3E%3Cg fill="%2312473f" font-family="Arial,sans-serif" text-anchor="middle"%3E%3Ctext x="320" y="305" font-size="34" font-weight="700"%3ECart item%3C/text%3E%3Ctext x="320" y="350" font-size="20" fill="%236b7b86"%3EImage unavailable%3C/text%3E%3C/g%3E%3C/svg%3E';

  readonly auth = inject(AuthFacade);
  readonly cart = inject(CartFacade);
  private readonly notifications = inject(NotificationService);
  private readonly router = inject(Router);

  readonly couponCode = signal('');

  async ngOnInit(): Promise<void> {
    if (await this.auth.requireAuthentication('/cart')) {
      await this.cart.load();
    }
  }

  async reload(): Promise<void> {
    await this.cart.load();
  }

  async increment(item: CartItem): Promise<void> {
    await this.cart.update(item.id, item.quantity + 1);
  }

  async decrement(item: CartItem): Promise<void> {
    if (item.quantity <= 1) return;
    await this.cart.update(item.id, item.quantity - 1);
  }

  async setQuantity(item: CartItem, event: Event): Promise<void> {
    const quantity = Number(this.inputValue(event));
    if (!Number.isInteger(quantity) || quantity < 1) {
      this.notifications.warning('Quantity must be at least 1.');
      return;
    }
    if (quantity !== item.quantity) {
      await this.cart.update(item.id, quantity);
    }
  }

  async remove(item: CartItem): Promise<void> {
    await this.cart.remove(item.id);
  }

  async clearCart(): Promise<void> {
    if (!window.confirm('Clear every item from your cart?')) return;
    await this.cart.clear();
  }

  async applyCoupon(event: Event): Promise<void> {
    event.preventDefault();
    const code = this.couponCode().trim();
    if (!code) return;

    await this.cart.applyCoupon(code);
    this.couponCode.set('');
  }

  async removeCoupon(): Promise<void> {
    await this.cart.removeCoupon();
  }

  startCheckout(): void {
    this.router.navigate(['/checkout']);
  }

  hasDiscount(): boolean {
    return Number(this.cart.cart().discountTotal) > 0;
  }

  image(item: CartItem): string {
    return item.imageUrl || this.fallbackImage;
  }

  optionLabel(item: CartItem): string {
    return Object.entries(item.options)
      .map(([name, value]) => `${name}: ${value}`)
      .join(' / ');
  }

  inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  useFallbackImage(event: Event): void {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.dataset['fallbackApplied'] !== 'true') {
      image.dataset['fallbackApplied'] = 'true';
      image.src = this.fallbackImage;
    }
  }
}
