import { inject, Injectable, signal } from '@angular/core';
import { WishlistItem } from '../../core/models/commerce.models';
import { NotificationService } from '../../state/ui/notification.service';
import { WishlistService } from './wishlist.service';

@Injectable({ providedIn: 'root' })
export class WishlistFacade {
  private readonly service = inject(WishlistService);
  private readonly notifications = inject(NotificationService);

  readonly items = signal<WishlistItem[]>([]);
  readonly loading = signal(false);

  async load(): Promise<void> {
    await this.run(async () => this.items.set((await this.service.get()).items));
  }

  async add(productId: string): Promise<void> {
    await this.run(async () => {
      this.items.set((await this.service.add(productId)).items);
      this.notifications.success('Added to wishlist.');
    });
  }

  async remove(productId: string): Promise<void> {
    await this.run(async () => this.items.set((await this.service.remove(productId)).items));
  }

  has(productId: string): boolean {
    return this.items().some((item) => item.productId === productId);
  }

  reset(): void {
    this.items.set([]);
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    try {
      await action();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Wishlist action failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
