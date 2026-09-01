import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { OrdersFacade } from './orders.facade';

const statuses = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'];

@Component({
  standalone: true,
  imports: [RouterLink, MoneyPipe, EmptyStateComponent],
  template: `
    @if (orders.selectedOrder(); as order) {
      <section class="surface">
        <a class="breadcrumb-link" routerLink="/orders">Orders</a>
        <div class="section-heading compact"><h1>Order #{{ order.id.slice(0, 8).toUpperCase() }}</h1><span class="status">{{ order.status }}</span></div>
        <div class="timeline">
          @for (status of statuses; track status) {
            <span [class.complete]="isComplete(order.status, status)">{{ status }}</span>
          }
        </div>
        <div class="order-lines">
          @for (item of order.items; track item.id) {
            <article class="summary-item"><span>{{ item.quantity }} x {{ item.productName }} ({{ item.sku }})</span><strong>{{ item.lineTotal | money:item.currency }}</strong></article>
          }
        </div>
        <dl class="mt-4">
          <div><dt>Subtotal</dt><dd>{{ order.subtotal | money:order.currency }}</dd></div>
          <div><dt>Discount</dt><dd>-{{ order.discountTotal | money:order.currency }}</dd></div>
          <div><dt>Shipping</dt><dd>{{ order.shippingTotal | money:order.currency }}</dd></div>
          <div class="grand"><dt>Total</dt><dd>{{ order.grandTotal | money:order.currency }}</dd></div>
        </dl>
      </section>
    } @else {
      <app-empty-state title="Order unavailable" message="The order could not be loaded." />
    }
  `,
})
export class OrderDetailPage implements OnInit {
  readonly orders = inject(OrdersFacade);
  private readonly route = inject(ActivatedRoute);
  readonly statuses = statuses;

  ngOnInit(): void {
    void this.orders.loadOne(this.route.snapshot.paramMap.get('id') ?? '');
  }

  isComplete(current: string, status: string): boolean {
    return statuses.indexOf(status) <= statuses.indexOf(current);
  }
}
