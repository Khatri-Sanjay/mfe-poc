import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../../core/models/api.model';
import { Coupon } from '../../core/models/coupon.model';
import { InventoryItem } from '../../core/models/inventory.model';
import { Order } from '../../core/models/order.model';
import { Product } from '../../core/models/product.model';
import { Review } from '../../core/models/review.model';
import { AdminRouteService } from '../../core/services/admin-route.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

type DashboardMetric = {
  label: string;
  value: string | number;
  icon: string;
  tone: string;
  route: string;
  hint: string;
};

type QuickAction = {
  label: string;
  description: string;
  icon: string;
  route: string;
};

type LoadedList<T> = {
  data: T[];
  metaTotal: number;
};

@Component({
  selector: 'app-dashboard',
  imports: [DatePipe, MoneyPipe, RouterLink],
  template: `
    <div class="admin-page-content dashboard-page">
      <section class="dashboard-hero">
        <div>
          <p class="eyebrow">Store Operations</p>
          <h1>Dashboard</h1>
          <p class="muted">
            Monitor orders, catalog health, stock pressure, and customer activity from one place.
          </p>
        </div>
        <div class="hero-actions">
          <a [routerLink]="adminRoute.link('/products/new')" class="btn-primary compact">
            <i class="bi bi-plus-lg"></i>
            Product
          </a>
          <a [routerLink]="adminRoute.link('/orders')" class="btn-secondary compact">
            <i class="bi bi-receipt"></i>
            Orders
          </a>
        </div>
      </section>

      @if (loading()) {
        <div class="dashboard-skeleton"><span></span><span></span><span></span><span></span></div>
      } @else {
        <section class="dashboard-metrics" aria-label="Dashboard metrics">
          @for (metric of metrics(); track metric.label) {
            <a
              [routerLink]="adminRoute.link(metric.route)"
              class="dashboard-metric {{ metric.tone }}"
            >
              <span class="metric-icon"><i [class]="metric.icon"></i></span>
              <span class="metric-copy">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
                <small>{{ metric.hint }}</small>
              </span>
            </a>
          }
        </section>

        @if (loadError()) {
          <div class="dashboard-alert">
            <i class="bi bi-exclamation-triangle"></i>
            <span>{{ loadError() }}</span>
          </div>
        }

        <section class="dashboard-grid">
          <div class="surface dashboard-panel order-panel">
            <div class="section-heading">
              <div>
                <h2>Order Pipeline</h2>
                <p class="muted">Open order workload by status.</p>
              </div>
              <a [routerLink]="adminRoute.link('/orders')" class="link-button">View all</a>
            </div>
            <div class="status-list">
              @for (item of orderPipeline(); track item.status) {
                <div class="status-row">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.count }}</strong>
                  <span class="status-bar">
                    <span [style.width.%]="item.percent"></span>
                  </span>
                </div>
              }
            </div>
          </div>

          <div class="surface dashboard-panel">
            <div class="section-heading">
              <div>
                <h2>Stock Watch</h2>
                <p class="muted">Variants that need attention soon.</p>
              </div>
              <a [routerLink]="adminRoute.link('/inventory')" class="link-button">Inventory</a>
            </div>
            @if (lowStockItems().length === 0) {
              <div class="compact-empty">
                <i class="bi bi-check2-circle"></i>
                <span>No low stock items in the loaded inventory.</span>
              </div>
            } @else {
              <div class="watch-list">
                @for (item of lowStockItems(); track item.id) {
                  <div class="watch-row">
                    <div>
                      <strong>{{ item.sku }}</strong>
                      <span>{{ item.productName }}</span>
                    </div>
                    <span
                      class="stock"
                      [class.out]="item.quantityAvailable === 0"
                      [class.in]="item.quantityAvailable > 0"
                    >
                      {{ item.quantityAvailable }} left
                    </span>
                  </div>
                }
              </div>
            }
          </div>

          <div class="surface dashboard-panel recent-orders">
            <div class="section-heading">
              <div>
                <h2>Recent Orders</h2>
                <p class="muted">Latest orders from the loaded order feed.</p>
              </div>
              <a [routerLink]="adminRoute.link('/orders')" class="link-button">Manage</a>
            </div>
            @if (recentOrders().length === 0) {
              <div class="compact-empty">
                <i class="bi bi-receipt"></i>
                <span>No orders available.</span>
              </div>
            } @else {
              <div class="recent-list">
                @for (order of recentOrders(); track order.id) {
                  <div class="recent-row">
                    <div>
                      <strong>#{{ order.id.slice(0, 8) }}</strong>
                      <span>{{
                        order.createdAt ? (order.createdAt | date: 'mediumDate') : 'No date'
                      }}</span>
                    </div>
                    <span class="status">{{ order.status }}</span>
                    <strong>{{ order.grandTotal | money: order.currency }}</strong>
                  </div>
                }
              </div>
            }
          </div>

          <div class="surface dashboard-panel">
            <div class="section-heading">
              <div>
                <h2>Quick Actions</h2>
                <p class="muted">Jump into frequent admin tasks.</p>
              </div>
            </div>
            <div class="quick-actions">
              @for (action of quickActions; track action.route) {
                <a [routerLink]="adminRoute.link(action.route)" class="quick-action">
                  <i [class]="action.icon"></i>
                  <span>
                    <strong>{{ action.label }}</strong>
                    <small>{{ action.description }}</small>
                  </span>
                </a>
              }
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }

    .dashboard-page {
      gap: 1.2rem;
    }

    .dashboard-hero {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 1rem;
      border: 1px solid rgba(18, 71, 63, 0.12);
      border-radius: var(--radius-lg);
      background: linear-gradient(135deg, rgba(18, 71, 63, 0.1), rgba(200, 138, 45, 0.12)), #fff;
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
    }

    .dashboard-hero h1,
    .dashboard-hero p {
      margin-bottom: 0;
    }

    .dashboard-hero h1 {
      font-size: clamp(1.9rem, 3vw, 2.65rem);
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      gap: 0.55rem;
    }

    .dashboard-metrics,
    .dashboard-skeleton {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 1rem;
    }

    .dashboard-metric {
      display: grid;
      grid-template-columns: 2.65rem minmax(0, 1fr);
      gap: 0.8rem;
      align-items: center;
      min-height: 7.2rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: #fff;
      padding: 1rem;
      box-shadow: var(--shadow-sm);
      transition:
        transform 160ms ease,
        box-shadow 160ms ease,
        border-color 160ms ease;
    }

    .dashboard-metric:hover {
      transform: translateY(-2px);
      border-color: rgba(18, 71, 63, 0.32);
      box-shadow: var(--shadow-md);
    }

    .metric-icon {
      display: grid;
      width: 2.65rem;
      height: 2.65rem;
      place-items: center;
      border-radius: var(--radius-md);
      background: var(--color-surface-muted);
      color: var(--color-primary);
      font-size: 1.15rem;
    }

    .dashboard-metric.revenue .metric-icon {
      background: #fff4df;
      color: var(--color-warning);
    }

    .dashboard-metric.warning .metric-icon {
      background: #fff1f0;
      color: var(--color-danger);
    }

    .dashboard-metric.info .metric-icon {
      background: #edf6ff;
      color: var(--color-info);
    }

    .metric-copy {
      display: grid;
      min-width: 0;
      gap: 0.16rem;
    }

    .metric-copy span,
    .metric-copy small {
      color: var(--color-text-muted);
      font-size: 0.78rem;
      font-weight: 800;
    }

    .metric-copy strong {
      overflow: hidden;
      color: var(--color-text-primary);
      font-size: 1.45rem;
      font-weight: 950;
      line-height: 1.1;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .dashboard-alert {
      display: flex;
      align-items: center;
      gap: 0.55rem;
      border: 1px solid rgba(154, 106, 0, 0.22);
      border-radius: var(--radius-md);
      background: #fffaf0;
      color: var(--color-warning);
      padding: 0.75rem 0.9rem;
      font-weight: 800;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: minmax(0, 1.25fr) minmax(21rem, 0.75fr);
      gap: 1rem;
      align-items: start;
    }

    .dashboard-panel {
      display: grid;
      gap: 0.9rem;
      min-width: 0;
    }

    .order-panel,
    .recent-orders {
      min-height: 20rem;
    }

    .status-list,
    .watch-list,
    .recent-list,
    .quick-actions {
      display: grid;
      gap: 0.65rem;
    }

    .status-row {
      display: grid;
      grid-template-columns: minmax(8rem, 1fr) auto;
      gap: 0.45rem 0.75rem;
      align-items: center;
      color: var(--color-text-secondary);
      font-weight: 850;
    }

    .status-row strong {
      color: var(--color-text-primary);
    }

    .status-bar {
      grid-column: 1 / -1;
      height: 0.55rem;
      overflow: hidden;
      border-radius: 999px;
      background: var(--color-surface-muted);
    }

    .status-bar span {
      display: block;
      height: 100%;
      min-width: 0.25rem;
      border-radius: inherit;
      background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
    }

    .watch-row,
    .recent-row,
    .quick-action {
      display: grid;
      align-items: center;
      gap: 0.75rem;
      border: 1px solid rgba(18, 71, 63, 0.1);
      border-radius: var(--radius-md);
      background: #fbfdfc;
      padding: 0.75rem;
    }

    .watch-row {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    .watch-row div,
    .recent-row div,
    .quick-action span {
      display: grid;
      min-width: 0;
      gap: 0.16rem;
    }

    .watch-row strong,
    .recent-row strong,
    .quick-action strong {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .watch-row span:not(.stock),
    .recent-row span:not(.status),
    .quick-action small {
      overflow: hidden;
      color: var(--color-text-muted);
      font-size: 0.82rem;
      font-weight: 750;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .recent-row {
      grid-template-columns: minmax(0, 1fr) auto auto;
    }

    .quick-action {
      grid-template-columns: 2.25rem minmax(0, 1fr);
      color: inherit;
    }

    .quick-action:hover {
      border-color: rgba(18, 71, 63, 0.28);
      background: var(--color-surface-muted);
    }

    .quick-action i {
      display: grid;
      width: 2.25rem;
      height: 2.25rem;
      place-items: center;
      border-radius: var(--radius-md);
      background: #fff;
      color: var(--color-primary);
    }

    .compact-empty {
      display: grid;
      min-height: 8rem;
      place-items: center;
      gap: 0.35rem;
      border: 1px dashed var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      padding: 1rem;
      text-align: center;
      font-weight: 800;
    }

    .compact-empty i {
      color: var(--color-primary);
      font-size: 1.6rem;
    }

    .dashboard-skeleton span {
      min-height: 7.2rem;
      border-radius: var(--radius-lg);
      background: linear-gradient(90deg, #eef3f1, #f8faf9, #eef3f1);
      background-size: 200% 100%;
      animation: skeleton 1.3s infinite;
    }

    @media (max-width: 1180px) {
      .dashboard-metrics,
      .dashboard-skeleton {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .dashboard-grid {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 640px) {
      .dashboard-hero {
        align-items: start;
        flex-direction: column;
      }

      .hero-actions {
        justify-content: flex-start;
        width: 100%;
      }

      .dashboard-metrics,
      .dashboard-skeleton {
        grid-template-columns: 1fr;
      }

      .recent-row {
        grid-template-columns: 1fr;
        align-items: start;
      }
    }
  `,
})
export class DashboardComponent implements OnInit {
  private http = inject(HttpClient);
  adminRoute = inject(AdminRouteService);

  orders = signal<Order[]>([]);
  products = signal<Product[]>([]);
  usersTotal = signal(0);
  inventory = signal<InventoryItem[]>([]);
  reviews = signal<Review[]>([]);
  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  loadError = signal('');

  quickActions: QuickAction[] = [
    {
      label: 'Add product',
      description: 'Create catalog items and variants',
      icon: 'bi bi-plus-square',
      route: '/products/new',
    },
    {
      label: 'Process orders',
      description: 'Update payment and shipping status',
      icon: 'bi bi-receipt-cutoff',
      route: '/orders',
    },
    {
      label: 'Moderate reviews',
      description: 'Approve or reject product feedback',
      icon: 'bi bi-star',
      route: '/reviews',
    },
    {
      label: 'Manage coupons',
      description: 'Control promotions and usage limits',
      icon: 'bi bi-percent',
      route: '/coupons',
    },
  ];

  metrics = computed<DashboardMetric[]>(() => [
    {
      label: 'Orders',
      value: this.totalOrders(),
      icon: 'bi bi-bag-check',
      tone: 'orders',
      route: '/orders',
      hint: `${this.openOrders()} need action`,
    },
    {
      label: 'Loaded Revenue',
      value: new MoneyPipe().transform(this.loadedRevenue(), this.primaryCurrency()),
      icon: 'bi bi-cash-stack',
      tone: 'revenue',
      route: '/orders',
      hint: 'From loaded orders',
    },
    {
      label: 'Active Products',
      value: this.activeProducts(),
      icon: 'bi bi-box-seam',
      tone: 'products',
      route: '/products',
      hint: `${this.productsTotal()} total products`,
    },
    {
      label: 'Stock Alerts',
      value: this.lowStockItems().length,
      icon: 'bi bi-exclamation-octagon',
      tone: 'warning',
      route: '/inventory',
      hint: 'Low or unavailable variants',
    },
    {
      label: 'Users',
      value: this.usersTotal(),
      icon: 'bi bi-people',
      tone: 'info',
      route: '/users',
      hint: 'Registered accounts',
    },
    {
      label: 'Pending Reviews',
      value: this.pendingReviews(),
      icon: 'bi bi-chat-square-text',
      tone: 'warning',
      route: '/reviews',
      hint: 'Waiting moderation',
    },
    {
      label: 'Active Coupons',
      value: this.activeCoupons(),
      icon: 'bi bi-ticket-perforated',
      tone: 'revenue',
      route: '/coupons',
      hint: `${this.coupons().length} total coupons`,
    },
    {
      label: 'Reserved Stock',
      value: this.reservedStock(),
      icon: 'bi bi-boxes',
      tone: 'info',
      route: '/inventory',
      hint: 'Units reserved',
    },
  ]);

  totalOrders = computed(() => this.ordersMetaTotal || this.orders().length);
  productsTotal = computed(() => this.productsMetaTotal || this.products().length);
  activeProducts = computed(
    () => this.products().filter((product) => product.status === 'ACTIVE').length,
  );
  pendingReviews = computed(
    () => this.reviews().filter((review) => review.status === 'PENDING').length,
  );
  activeCoupons = computed(() => this.coupons().filter((coupon) => coupon.isActive).length);
  reservedStock = computed(() =>
    this.inventory().reduce((total, item) => total + (item.quantityReserved || 0), 0),
  );
  loadedRevenue = computed(() =>
    this.orders().reduce((total, order) => total + this.toNumber(order.grandTotal), 0),
  );
  openOrders = computed(
    () =>
      this.orders().filter(
        (order) => !['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(order.status),
      ).length,
  );
  primaryCurrency = computed(() => this.orders()[0]?.currency || 'AUD');

  lowStockItems = computed(() =>
    [...this.inventory()]
      .filter((item) => item.quantityAvailable <= (item.reorderLevel ?? 5))
      .sort((a, b) => a.quantityAvailable - b.quantityAvailable)
      .slice(0, 5),
  );

  recentOrders = computed(() =>
    [...this.orders()]
      .sort((a, b) => this.dateValue(b.createdAt) - this.dateValue(a.createdAt))
      .slice(0, 5),
  );

  orderPipeline = computed(() => {
    const statuses = ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    const orders = this.orders();
    const max = Math.max(
      1,
      ...statuses.map((status) => orders.filter((order) => order.status === status).length),
    );

    return statuses.map((status) => {
      const count = orders.filter((order) => order.status === status).length;
      return {
        status: status.replaceAll('_', ' '),
        label: status.replaceAll('_', ' '),
        count,
        percent: Math.round((count / max) * 100),
      };
    });
  });

  private ordersMetaTotal = 0;
  private productsMetaTotal = 0;

  ngOnInit() {
    this.loadDashboard();
  }

  private loadDashboard() {
    this.loading.set(true);
    this.loadError.set('');

    forkJoin({
      orders: this.getList<Order>('/admin/orders?page=1&limit=100&sortOrder=desc'),
      products: this.getList<Product>(
        '/admin/products?page=1&limit=100&sortBy=createdAt&sortOrder=desc',
      ),
      users: this.getCount('/admin/users?page=1&limit=1'),
      inventory: this.getList<InventoryItem>('/admin/inventory?page=1&limit=100&sortOrder=desc'),
      reviews: this.getList<Review>('/admin/reviews?page=1&limit=100&sortOrder=desc'),
      coupons: this.getArray<Coupon>('/admin/coupons'),
    }).subscribe({
      next: ({ orders, products, users, inventory, reviews, coupons }) => {
        this.ordersMetaTotal = orders.metaTotal;
        this.productsMetaTotal = products.metaTotal;
        this.orders.set(orders.data);
        this.products.set(products.data);
        this.usersTotal.set(users);
        this.inventory.set(inventory.data);
        this.reviews.set(reviews.data);
        this.coupons.set(coupons);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Dashboard data could not be loaded. Try refreshing the page.');
        this.loading.set(false);
      },
    });
  }

  private getList<T>(path: string) {
    return this.http.get<any>(`${environment.apiUrl}${path}`).pipe(
      map((res): LoadedList<T> => ({
        data: res.data ?? [],
        metaTotal: res.meta?.total ?? res.data?.length ?? 0,
      })),
      catchError(() => {
        this.loadError.set('Some dashboard sections could not be loaded.');
        return of({ data: [], metaTotal: 0 } as LoadedList<T>);
      }),
    );
  }

  private getCount(path: string) {
    return this.http.get<any>(`${environment.apiUrl}${path}`).pipe(
      map((res) => res.meta?.total ?? res.data?.length ?? 0),
      catchError(() => of(0)),
    );
  }

  private getArray<T>(path: string) {
    return this.http.get<any>(`${environment.apiUrl}${path}`).pipe(
      map((res) => res.data ?? []),
      catchError(() => of([] as T[])),
    );
  }

  private toNumber(value: string | number | undefined) {
    const parsed = typeof value === 'number' ? value : parseFloat(value || '0');
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private dateValue(value?: string) {
    return value ? new Date(value).getTime() : 0;
  }
}
