import { computed, inject, Injectable, signal } from '@angular/core';
import { Cart } from '../../core/models/commerce.models';
import { CartService } from './cart.service';
import { NotificationService } from '../../state/ui/notification.service';

const emptyCart: Cart = {
  id: '',
  items: [],
  subtotal: '0.00',
  discountTotal: '0.00',
  shippingTotal: '0.00',
  taxTotal: '0.00',
  grandTotal: '0.00',
  currency: 'AUD',
  itemCount: 0,
};

@Injectable({ providedIn: 'root' })
export class CartFacade {
  private readonly service = inject(CartService);
  private readonly notifications = inject(NotificationService);

  readonly cart = signal<Cart>(emptyCart);
  readonly loading = signal(false);
  readonly itemCount = computed(() => this.cart().itemCount);
  readonly items = computed(() => this.cart().items);

  async load(): Promise<void> {
    await this.run(async () => this.cart.set(await this.service.get()));
  }

  async addProduct(variantId: string, quantity = 1): Promise<void> {
    await this.run(async () => {
      this.cart.set(await this.service.add(variantId, quantity));
      this.notifications.success('Product added to cart.');
    });
  }

  async update(itemId: string, quantity: number): Promise<void> {
    if (!Number.isInteger(quantity) || quantity < 1) return;
    await this.run(async () => this.cart.set(await this.service.update(itemId, quantity)));
  }

  async remove(itemId: string): Promise<void> {
    await this.run(async () => this.cart.set(await this.service.remove(itemId)));
  }

  async clear(): Promise<void> {
    await this.run(async () => {
      await this.service.clear();
      this.cart.set(emptyCart);
    });
  }

  async applyCoupon(code: string): Promise<void> {
    await this.run(async () => {
      this.cart.set(await this.service.applyCoupon(code));
      this.notifications.success('Coupon applied.');
    });
  }

  async removeCoupon(): Promise<void> {
    await this.run(async () => this.cart.set(await this.service.removeCoupon()));
  }

  reset(): void {
    this.cart.set(emptyCart);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    try {
      await action();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Cart action failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
