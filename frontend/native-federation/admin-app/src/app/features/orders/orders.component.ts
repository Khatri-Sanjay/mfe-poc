import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Order, OrderStatus } from '../../core/models/order.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-orders',
  imports: [FormsModule, MoneyPipe, PaginationComponent],
  template: `
    <div class="admin-page-content">
      <div class="admin-toolbar">
        <select [(ngModel)]="statusFilter" (change)="onFilterChange()">
          <option value="">All Statuses</option>
          @for (s of statuses; track s) {
            <option [value]="s">{{ s }}</option>
          }
        </select>
      </div>
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (orders().length === 0) {
        <div class="empty-state">
          <i class="bi bi-receipt"></i>
          <h2>No orders found</h2>
        </div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-5 header">
              <span>Order ID</span><span>Status</span><span>Items</span><span>Total</span
              ><span>Actions</span>
            </div>
          </div>
          <div class="data-table-body">
            @for (order of orders(); track order.id) {
              <div class="data-row cols-5">
                <span>{{ order.id.substring(0, 8) }}...</span>
                <span
                  ><span class="status">{{ order.status }}</span></span
                >
                <span>{{ order.items?.length || 0 }}</span>
                <span>{{ order.grandTotal | money }}</span>
                <span class="table-actions">
                  <select
                    class="compact"
                    [ngModel]="order.status"
                    (ngModelChange)="updateStatus(order, $event)"
                    style="max-width:10rem"
                  >
                    @for (s of statuses; track s) {
                      <option [value]="s">{{ s }}</option>
                    }
                  </select>
                </span>
              </div>
            }
          </div>
        </div>
      }
      @if (total() > 0) {
        <app-pagination
          [page]="page()"
          [limit]="limit()"
          [total]="total()"
          (goTo)="onPageChange($event)"
        />
      }
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class OrdersComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  orders = signal<Order[]>([]);
  loading = signal(true);
  statusFilter = '';
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  statuses: OrderStatus[] = [
    'PENDING_PAYMENT',
    'PAID',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUND_PENDING',
    'PARTIALLY_REFUNDED',
    'REFUNDED',
  ];

  ngOnInit() {
    this.loadOrders();
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.loadOrders();
  }

  onFilterChange() {
    this.page.set(1);
    this.loadOrders();
  }

  loadOrders() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      limit: this.limit(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    if (this.statusFilter) params.status = this.statusFilter;
    this.http.get<any>(`${environment.apiUrl}/admin/orders`, { params }).subscribe({
      next: (res) => {
        this.orders.set(res.data ?? []);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  updateStatus(order: Order, status: string) {
    this.http.patch(`${environment.apiUrl}/admin/orders/${order.id}/status`, { status }).subscribe({
      next: () => {
        this.toast.success('Updated', 'Order status updated.');
        this.loadOrders();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
