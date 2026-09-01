import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterLink } from "@angular/router";
import { CheckoutFacade } from "../checkout/checkout.facade";
import { AuthFacade } from "../../state/auth/auth.facade";
import { MoneyPipe } from "../../shared/pipes/money.pipe";
import { Order, OrderStatus } from "../../core/models/commerce.models";

@Component({
  selector: "app-order-list-page",
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
    @if (!auth.isAuthenticated()) {
      <div class="orders-auth-required">
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="bi bi-lock"></i>
          </div>
          <h2>Sign in to view orders</h2>
          <p>Please sign in to see your order history.</p>
          <a routerLink="/auth/login" class="btn-primary">Sign in</a>
        </div>
      </div>
    } @else {
      <div class="orders-container">
        <h1>My Orders</h1>

        @if (facade.loading()) {
          <div class="loading-list">
            @for (i of [1, 2, 3]; track i) {
              <div class="order-card-skeleton">
                <div class="loading-bar"></div>
                <div class="loading-bar short"></div>
              </div>
            }
          </div>
        } @else if (facade.orders().length === 0) {
          <div class="empty-state">
            <div class="empty-state-icon">
              <i class="bi bi-bag"></i>
            </div>
            <h2>No orders yet</h2>
            <p>When you place an order, it will appear here.</p>
            <a routerLink="/products" class="btn-primary">Browse Products</a>
          </div>
        } @else {
          <div class="order-list">
            @for (order of facade.orders(); track order.id) {
              <div class="order-card" [routerLink]="['/orders', order.id]">
                <div class="order-header">
                  <div class="order-id">
                    <span class="label">Order</span>
                    <span class="value">{{ order.id }}</span>
                  </div>
                  <div class="order-status">
                    <span class="status-badge" [attr.data-status]="order.status">
                      {{ formatStatus(order.status) }}
                    </span>
                  </div>
                </div>
                <div class="order-items">
                  @for (item of order.items.slice(0, 3); track item.id) {
                    <div class="order-item">
                      <span class="item-name">{{ item.productName }}</span>
                      <span class="item-qty">x{{ item.quantity }}</span>
                    </div>
                  }
                  @if (order.items.length > 3) {
                    <div class="order-more">
                      +{{ order.items.length - 3 }} more items
                    </div>
                  }
                </div>
                <div class="order-footer">
                  <div class="order-date">
                    {{ order.createdAt | date:'mediumDate' }}
                  </div>
                  <div class="order-total">
                    {{ order.grandTotal | money }}
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    }
  `,
  styles: `
    .orders-auth-required {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .empty-state {
      text-align: center;
      padding: 3rem;
    }

    .empty-state-icon {
      font-size: 3rem;
      color: var(--color-muted);
      margin-bottom: 1rem;
    }

    .empty-state h2 {
      font-size: 1.5rem;
      margin-bottom: 0.5rem;
    }

    .empty-state p {
      color: var(--color-muted);
      margin-bottom: 1.5rem;
    }

    .orders-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    h1 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
    }

    .order-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.25rem;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
    }

    .order-card:hover {
      border-color: var(--color-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.75rem;
    }

    .order-id .label {
      font-size: 0.75rem;
      color: var(--color-muted);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .order-id .value {
      display: block;
      font-weight: 600;
      font-size: 0.875rem;
      font-family: monospace;
    }

    .status-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: uppercase;
    }

    .status-badge[data-status="PAID"] {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge[data-status="PENDING_PAYMENT"] {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge[data-status="PROCESSING"] {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge[data-status="SHIPPED"] {
      background: #e0e7ff;
      color: #3730a3;
    }

    .status-badge[data-status="DELIVERED"] {
      background: #d1fae5;
      color: #065f46;
    }

    .status-badge[data-status="CANCELLED"] {
      background: #fee2e2;
      color: #991b1b;
    }

    .order-items {
      padding: 0.75rem 0;
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      padding: 0.25rem 0;
    }

    .item-name {
      color: var(--color-text);
    }

    .item-qty {
      color: var(--color-muted);
    }

    .order-more {
      font-size: 0.8125rem;
      color: var(--color-muted);
      font-style: italic;
      padding-top: 0.25rem;
    }

    .order-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 0.75rem;
    }

    .order-date {
      font-size: 0.875rem;
      color: var(--color-muted);
    }

    .order-total {
      font-weight: 700;
      font-size: 1.125rem;
    }

    .loading-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .order-card-skeleton {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.25rem;
    }

    .loading-bar {
      height: 16px;
      background: var(--color-background);
      border-radius: 4px;
      margin-bottom: 0.75rem;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .loading-bar.short {
      width: 60%;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }

    .btn-primary {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      background: var(--color-primary);
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      text-decoration: none;
    }
  `,
})
export class OrderListPage implements OnInit {
  readonly facade = inject(CheckoutFacade);
  readonly auth = inject(AuthFacade);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      this.facade.loadOrders();
    }
  }

  formatStatus(status: OrderStatus): string {
    return status.replace(/_/g, " ").toLowerCase();
  }
}
