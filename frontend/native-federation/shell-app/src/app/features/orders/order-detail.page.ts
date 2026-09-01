import { Component, OnInit, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { CheckoutFacade } from "../checkout/checkout.facade";
import { AuthFacade } from "../../state/auth/auth.facade";
import { MoneyPipe } from "../../shared/pipes/money.pipe";
import { Order, OrderStatus } from "../../core/models/commerce.models";

@Component({
  selector: "app-order-detail-page",
  standalone: true,
  imports: [CommonModule, RouterLink, MoneyPipe],
  template: `
    @if (!auth.isAuthenticated()) {
      <div class="order-auth-required">
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="bi bi-lock"></i>
          </div>
          <h2>Sign in to view order</h2>
          <a routerLink="/auth/login" class="btn-primary">Sign in</a>
        </div>
      </div>
    } @else if (loading()) {
      <div class="order-container">
        <div class="loading">
          <div class="loading-bar"></div>
          <div class="loading-bar"></div>
          <div class="loading-bar short"></div>
        </div>
      </div>
    } @else if (!order()) {
      <div class="order-container">
        <div class="empty-state">
          <div class="empty-state-icon">
            <i class="bi bi-exclamation-circle"></i>
          </div>
          <h2>Order not found</h2>
          <p>The order you're looking for doesn't exist or you don't have access.</p>
          <a routerLink="/orders" class="btn-primary">Back to Orders</a>
        </div>
      </div>
    } @else {
      <div class="order-container">
        <a routerLink="/orders" class="back-link">
          <i class="bi bi-arrow-left"></i> Back to Orders
        </a>

        <div class="order-header">
          <div>
            <h1>Order Details</h1>
            <div class="order-id">{{ order()!.id }}</div>
          </div>
          <span class="status-badge" [attr.data-status]="order()!.status">
            {{ formatStatus(order()!.status) }}
          </span>
        </div>

        <div class="order-grid">
          <!-- Items -->
          <div class="order-section">
            <h2>Items</h2>
            <div class="order-items">
              @for (item of order()!.items; track item.id) {
                <div class="order-item">
                  <div class="item-details">
                    <div class="item-name">{{ item.productName }}</div>
                    <div class="item-meta">
                      <span class="item-sku">{{ item.sku }}</span>
                      @for (entry of getOptionsArray(item.variantOptions); track entry[0]) {
                        <span class="item-option">{{ entry[0] }}: {{ entry[1] }}</span>
                      }
                    </div>
                    <div class="item-qty">Qty: {{ item.quantity }}</div>
                  </div>
                  <div class="item-price">
                    {{ item.lineTotal | money }}
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Totals -->
          <div class="order-section">
            <h2>Summary</h2>
            <div class="order-totals">
              <div class="total-row">
                <span>Subtotal</span>
                <span>{{ order()!.subtotal | money }}</span>
              </div>
              @if (order()!.discountTotal !== '0.00') {
                <div class="total-row discount">
                  <span>Discount</span>
                  <span>-{{ order()!.discountTotal | money }}</span>
                </div>
              }
              <div class="total-row">
                <span>Shipping</span>
                <span>{{ order()!.shippingTotal | money }}</span>
              </div>
              @if (order()!.taxTotal !== '0.00') {
                <div class="total-row">
                  <span>Tax</span>
                  <span>{{ order()!.taxTotal | money }}</span>
                </div>
              }
              <div class="total-row total">
                <span>Total</span>
                <span>{{ order()!.grandTotal | money }}</span>
              </div>
            </div>
          </div>

          <!-- Info -->
          <div class="order-section">
            <h2>Information</h2>
            <div class="info-rows">
              <div class="info-row">
                <span class="info-label">Order Date</span>
                <span>{{ order()!.createdAt | date:'medium' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Last Updated</span>
                <span>{{ order()!.updatedAt | date:'medium' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Status</span>
                <span class="status-badge" [attr.data-status]="order()!.status">
                  {{ formatStatus(order()!.status) }}
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          @if (order()!.status === 'PAID' || order()!.status === 'PENDING_PAYMENT') {
            <div class="order-section">
              <h2>Actions</h2>
              <button
                class="btn-danger"
                [disabled]="cancelling()"
                (click)="cancelOrder()"
              >
                @if (cancelling()) {
                  <span class="spinner"></span> Cancelling...
                } @else {
                  <i class="bi bi-x-circle"></i> Cancel Order
                }
              </button>
            </div>
          }
        </div>
      </div>
    }
  `,
  styles: `
    .order-auth-required {
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

    .order-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 2rem 1rem;
    }

    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--color-muted);
      text-decoration: none;
      font-size: 0.875rem;
      margin-bottom: 1.5rem;
    }

    .back-link:hover {
      color: var(--color-text);
    }

    .order-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }

    .order-header h1 {
      font-size: 1.75rem;
      margin-bottom: 0.25rem;
    }

    .order-id {
      font-family: monospace;
      font-size: 0.875rem;
      color: var(--color-muted);
    }

    .status-badge {
      display: inline-block;
      padding: 0.375rem 1rem;
      border-radius: 20px;
      font-size: 0.8125rem;
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

    .order-grid {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .order-section {
      background: white;
      border: 1px solid var(--color-border);
      border-radius: 12px;
      padding: 1.5rem;
    }

    .order-section h2 {
      font-size: 1.125rem;
      margin-bottom: 1rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-border);
    }

    .order-items {
      display: flex;
      flex-direction: column;
    }

    .order-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid var(--color-border);
    }

    .order-item:last-child {
      border-bottom: none;
    }

    .item-details {
      flex: 1;
    }

    .item-name {
      font-weight: 500;
    }

    .item-meta {
      font-size: 0.8125rem;
      color: var(--color-muted);
      display: flex;
      gap: 0.75rem;
      margin-top: 0.25rem;
    }

    .item-option::before {
      content: " | ";
    }

    .item-qty {
      font-size: 0.8125rem;
      color: var(--color-text);
      margin-top: 0.25rem;
    }

    .item-price {
      font-weight: 600;
      white-space: nowrap;
      margin-left: 1rem;
    }

    .order-totals {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .total-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
    }

    .total-row.discount {
      color: var(--color-success, #10b981);
    }

    .total-row.total {
      font-weight: 700;
      font-size: 1.125rem;
      padding-top: 0.75rem;
      border-top: 1px solid var(--color-border);
    }

    .info-rows {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .info-label {
      color: var(--color-muted);
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

    .btn-danger {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      background: #dc2626;
      color: white;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-danger:hover:not(:disabled) {
      background: #b91c1c;
    }

    .btn-danger:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .loading {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 2rem 0;
    }

    .loading-bar {
      height: 20px;
      background: var(--color-background);
      border-radius: 4px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    .loading-bar.short {
      width: 60%;
    }

    @keyframes pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.3; }
    }
  `,
})
export class OrderDetailPage implements OnInit {
  readonly facade = inject(CheckoutFacade);
  readonly auth = inject(AuthFacade);
  private route = inject(ActivatedRoute);

  order = signal<Order | null>(null);
  loading = signal(true);
  cancelling = signal(false);

  ngOnInit(): void {
    if (this.auth.isAuthenticated()) {
      const id = this.route.snapshot.paramMap.get("id");
      if (id) {
        this.loadOrder(id);
      } else {
        this.loading.set(false);
      }
    }
  }

  async loadOrder(id: string): Promise<void> {
    this.loading.set(true);
    const order = await this.facade.loadOrder(id);
    this.order.set(order);
    this.loading.set(false);
  }

  async cancelOrder(): Promise<void> {
    const o = this.order();
    if (!o) return;

    if (!confirm("Are you sure you want to cancel this order?")) return;

    this.cancelling.set(true);
    const success = await this.facade.cancelOrder(o.id);
    if (success) {
      this.order.set({ ...o, status: "CANCELLED" });
    }
    this.cancelling.set(false);
  }

  formatStatus(status: OrderStatus): string {
    return status.replace(/_/g, " ").toLowerCase();
  }

  getOptionsArray(options: Record<string, string>): [string, string][] {
    return Object.entries(options);
  }
}
