import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { OrdersFacade } from './orders.facade';

@Component({
  standalone: true,
  imports: [RouterLink, MoneyPipe, EmptyStateComponent],
  template: `
    <section class="surface">
      <div class="section-heading compact">
        <h1>Orders</h1>
        <button class="icon-btn" type="button" aria-label="Refresh orders" (click)="orders.load()"><i class="bi bi-arrow-repeat"></i></button>
      </div>
      @for (order of orders.orders(); track order.id) {
        <article class="order-card">
          <div><strong>#{{ shortId(order.id) }}</strong><span class="status">{{ order.status }}</span></div>
          <div>
            @for (item of order.items; track item.id) {
              <p>{{ item.quantity }} x {{ item.productName }} - {{ item.lineTotal | money:item.currency }}</p>
            }
          </div>
          <strong>{{ order.grandTotal | money:order.currency }}</strong>
          <div class="inline-actions">
            <a class="btn-secondary compact" [routerLink]="['/orders', order.id]">Details</a>
            <button class="btn-secondary compact" type="button" [disabled]="!canCancel(order.status)" (click)="cancel(order.id)">Cancel</button>
          </div>
        </article>
      } @empty {
        <app-empty-state title="No orders yet" message="Your completed orders will appear here.">
          <a class="btn-primary mt-3" routerLink="/products">Start shopping</a>
        </app-empty-state>
      }
    </section>
  `,
})
export class OrdersPage implements OnInit {
  readonly orders = inject(OrdersFacade);
  private readonly confirmDialog = inject(ConfirmDialogService);

  ngOnInit(): void {
    void this.orders.load();
  }

  shortId(id: string): string {
    return id.slice(0, 8).toUpperCase();
  }

  canCancel(status: string): boolean {
    return ['PENDING_PAYMENT', 'PAID'].includes(status);
  }

  async cancel(id: string): Promise<void> {
    if (await this.confirmDialog.confirm('Cancel order', 'Cancel this order? This cannot be undone from the customer app.', 'Cancel order')) {
      await this.orders.cancel(id);
    }
  }
}
