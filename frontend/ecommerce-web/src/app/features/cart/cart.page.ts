import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { CartFacade } from '../../state/cart/cart.facade';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe, EmptyStateComponent, FormsModule],
  template: `
    <section class="two-column">
      <div class="surface">
        <div class="section-heading compact">
          <h1>Cart</h1>
          <button class="btn-secondary" type="button" (click)="clear()">Clear cart</button>
        </div>
        @for (item of cart.items(); track item.id) {
          <article class="line-item">
            <img [src]="item.imageUrl || fallback" [alt]="item.productName" />
            <div>
              <strong>{{ item.productName }}</strong>
              <p>{{ item.sku }} - {{ optionText(item.options) }}</p>
              <span>{{ item.unitPrice | money: cart.cart().currency }}</span>
            </div>
            <div class="stepper" aria-label="Quantity selector">
              <button
                type="button"
                aria-label="Decrease quantity"
                (click)="cart.update(item.id, item.quantity - 1)"
              >
                <i class="bi bi-dash"></i>
              </button>
              <input
                [ngModel]="item.quantity"
                type="number"
                min="1"
                (ngModelChange)="cart.update(item.id, numberValue($event))"
              />
              <button
                type="button"
                aria-label="Increase quantity"
                (click)="cart.update(item.id, item.quantity + 1)"
              >
                <i class="bi bi-plus"></i>
              </button>
            </div>
            <strong>{{ item.lineTotal | money: cart.cart().currency }}</strong>
            <button
              class="icon-btn danger"
              type="button"
              aria-label="Remove item"
              (click)="remove(item.id)"
            >
              <i class="bi bi-trash"></i>
            </button>
          </article>
        } @empty {
          <app-empty-state
            title="Your cart is empty"
            message="Start shopping to add products to your cart."
          >
            <a class="btn-primary mt-3" routerLink="/products">Browse products</a>
          </app-empty-state>
        }
      </div>
      <aside class="surface totals">
        <h2>Order summary</h2>
        <form class="coupon-row" (ngSubmit)="cart.applyCoupon(coupon.value)">
          <input [formControl]="coupon" placeholder="Coupon code" />
          <button class="btn-secondary" type="submit">Apply</button>
        </form>
        <button class="link-button" type="button" (click)="cart.removeCoupon()">
          Remove coupon
        </button>
        <dl>
          <div>
            <dt>Subtotal</dt>
            <dd>{{ cart.cart().subtotal | money: cart.cart().currency }}</dd>
          </div>
          <div>
            <dt>Discount</dt>
            <dd>-{{ cart.cart().discountTotal | money: cart.cart().currency }}</dd>
          </div>
          <div class="grand">
            <dt>Total</dt>
            <dd>{{ cart.cart().grandTotal | money: cart.cart().currency }}</dd>
          </div>
        </dl>
        <a
          class="btn-primary w-full"
          routerLink="/checkout"
          [class.disabled]="cart.items().length === 0"
          >Checkout</a
        >
      </aside>
    </section>
  `,
})
export class CartPage implements OnInit {
  readonly cart = inject(CartFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly coupon = new FormControl('SAVE10', { nonNullable: true });
  readonly fallback = 'https://placehold.co/200x200/f4f7f6/19302d?text=Product';

  ngOnInit(): void {
    void this.cart.load();
  }

  async remove(itemId: string): Promise<void> {
    if (
      await this.confirmDialog.confirm(
        'Remove item',
        'Remove this product from your cart?',
        'Remove',
      )
    ) {
      await this.cart.remove(itemId);
    }
  }

  async clear(): Promise<void> {
    if (
      await this.confirmDialog.confirm(
        'Clear cart',
        'Remove every item from your cart?',
        'Clear cart',
      )
    ) {
      await this.cart.clear();
    }
  }

  numberValue(value: string | number): number {
    return Number(value);
  }

  optionText(options: Record<string, string>): string {
    const entries = Object.entries(options);
    return entries.length
      ? entries.map(([key, value]) => `${key}: ${value}`).join(', ')
      : 'Default';
  }
}
