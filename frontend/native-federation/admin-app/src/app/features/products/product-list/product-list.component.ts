import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Product } from '../../../core/models/product.model';
import { AdminRouteService } from '../../../core/services/admin-route.service';
import { ToastService } from '../../../shared/components/toast/toast.service';
import { MoneyPipe } from '../../../shared/pipes/money.pipe';
import { PaginationComponent } from '../../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-product-list',
  imports: [RouterLink, MoneyPipe, PaginationComponent],
  template: `
    <div class="admin-page-content">
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (products().length === 0) {
        <div class="empty-state">
          <i class="bi bi-box-seam"></i>
          <h2>No products yet</h2>
          <p>Create your first product to get started.</p>
          <a [routerLink]="adminRoute.link('/products/new')" class="btn-primary compact"
            >Add Product</a
          >
        </div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-7 header">
              <span>Name</span>
              <span>SKU</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Status</span>
              <span>Rating</span>
              <span>Actions</span>
            </div>
          </div>
          <div class="data-table-body">
            @for (product of products(); track product.id) {
              <div class="data-row cols-7">
                <span>{{ product.name }}</span>
                <span>{{ product.variants[0]?.sku || '-' }}</span>
                <span>{{ product.variants[0]?.price | money }}</span>
                <span>
                  @if (product.variants[0]?.quantityAvailable > 0) {
                    <span class="stock in">In Stock</span>
                  } @else {
                    <span class="stock out">Out of Stock</span>
                  }
                </span>
                <span>
                  <span class="status">{{ product.status }}</span>
                </span>
                <span>
                  @if (product.averageRating) {
                    <span class="rating">
                      <i class="bi bi-star-fill"></i> {{ product.averageRating }}
                    </span>
                  } @else {
                    <span class="muted">-</span>
                  }
                </span>
                <span class="table-actions">
                  <a
                    [routerLink]="adminRoute.link('/products/' + product.id)"
                    class="icon-btn compact"
                    title="Edit"
                  >
                    <i class="bi bi-pencil"></i>
                  </a>
                  <button
                    class="icon-btn danger compact"
                    title="Delete"
                    (click)="deleteProduct(product)"
                  >
                    <i class="bi bi-trash"></i>
                  </button>
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
export class ProductListComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  adminRoute = inject(AdminRouteService);

  products = signal<Product[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(10);
  total = signal(0);

  ngOnInit() {
    this.loadProducts();
  }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      limit: this.limit(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    this.http.get<any>(`${environment.apiUrl}/admin/products`, { params }).subscribe({
      next: (res) => {
        this.products.set(res.data ?? []);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error', 'Failed to load products.');
        this.loading.set(false);
      },
    });
  }

  deleteProduct(product: Product) {
    if (!confirm(`Delete "${product.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/products/${product.id}`).subscribe({
      next: () => {
        this.toast.success('Deleted', 'Product deleted successfully.');
        this.loadProducts();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed to delete product.'),
    });
  }
}
