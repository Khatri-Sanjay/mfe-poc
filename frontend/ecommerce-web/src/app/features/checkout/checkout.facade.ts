import { inject, Injectable, signal } from '@angular/core';
import { CheckoutQuote, ShippingMethod } from '../../core/models/commerce.models';
import { CartFacade } from '../../state/cart/cart.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { CheckoutPayload, CheckoutService } from './checkout.service';

@Injectable({ providedIn: 'root' })
export class CheckoutFacade {
  private readonly service = inject(CheckoutService);
  private readonly cart = inject(CartFacade);
  private readonly notifications = inject(NotificationService);

  readonly shippingMethods = signal<ShippingMethod[]>([]);
  readonly quote = signal<CheckoutQuote | null>(null);
  readonly loading = signal(false);
  readonly submitting = signal(false);

  async loadShippingMethods(): Promise<void> {
    await this.run(async () => this.shippingMethods.set(await this.service.shippingMethods()));
  }

  async refreshQuote(shippingMethodId?: string): Promise<void> {
    if (!shippingMethodId || this.cart.items().length === 0) {
      this.quote.set(null);
      return;
    }
    await this.run(async () => this.quote.set(await this.service.quote(shippingMethodId)));
  }

  async checkout(payload: CheckoutPayload): Promise<string | null> {
    this.submitting.set(true);
    try {
      const result = await this.service.checkout(payload);
      await this.cart.load();
      this.quote.set(null);
      this.notifications.success('Order placed successfully.');
      return result.order.id;
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Checkout failed.');
      return null;
    } finally {
      this.submitting.set(false);
    }
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    try {
      await action();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Checkout action failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
