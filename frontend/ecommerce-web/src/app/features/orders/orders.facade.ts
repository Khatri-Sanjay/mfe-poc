import { inject, Injectable, signal } from '@angular/core';
import { PaginationMeta } from '../../core/http/api-response.model';
import { Order } from '../../core/models/commerce.models';
import { NotificationService } from '../../state/ui/notification.service';
import { OrdersService } from './orders.service';

@Injectable({ providedIn: 'root' })
export class OrdersFacade {
  private readonly service = inject(OrdersService);
  private readonly notifications = inject(NotificationService);

  readonly orders = signal<Order[]>([]);
  readonly selectedOrder = signal<Order | null>(null);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);

  async load(page = 1): Promise<void> {
    await this.run(async () => {
      const result = await this.service.list(page);
      this.orders.set(result.items);
      this.meta.set(result.meta);
    });
  }

  async loadOne(id: string): Promise<void> {
    await this.run(async () => this.selectedOrder.set(await this.service.get(id)));
  }

  async cancel(id: string): Promise<void> {
    await this.run(async () => {
      await this.service.cancel(id);
      await this.load();
      this.notifications.success('Order cancelled.');
    });
  }

  private async run(action: () => Promise<void>): Promise<void> {
    this.loading.set(true);
    try {
      await action();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Order action failed.');
    } finally {
      this.loading.set(false);
    }
  }
}
