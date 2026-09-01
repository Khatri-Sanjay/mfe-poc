import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { InventoryItem } from '../../core/models/inventory.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-inventory',
  imports: [FormsModule, PaginationComponent],
  template: `
    <div class="admin-page-content">
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (items().length === 0) {
        <div class="empty-state"><i class="bi bi-boxes"></i><h2>No inventory items</h2></div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-6 header"><span>SKU</span><span>Product</span><span>On Hand</span><span>Reserved</span><span>Available</span><span>Actions</span></div>
          </div>
          <div class="data-table-body">
            @for (item of items(); track item.id) {
              <div class="data-row cols-6">
                <span>{{ item.sku }}</span>
                <span>{{ item.productName }}</span>
                <span>{{ item.quantityOnHand }}</span>
                <span>{{ item.quantityReserved }}</span>
                <span>{{ item.quantityAvailable }}</span>
                <span class="table-actions">
                  <button class="icon-btn compact" (click)="adjustStock(item)"><i class="bi bi-plus-slash-minus"></i></button>
                </span>
              </div>
            }
          </div>
        </div>
      }
      @if (total() > 0) {
        <app-pagination [page]="page()" [limit]="limit()" [total]="total()" (goTo)="onPageChange($event)" />
      }
    </div>
  `,
  styles: `:host { display: contents; }`,
})
export class InventoryComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  items = signal<InventoryItem[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(10);
  total = signal(0);

  ngOnInit() { this.load(); }

  onPageChange(newPage: number) {
    this.page.set(newPage);
    this.load();
  }

  load() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      limit: this.limit(),
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    this.http.get<any>(`${environment.apiUrl}/admin/inventory`, { params }).subscribe({
      next: (res) => {
        this.items.set(res.data ?? []);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  adjustStock(item: InventoryItem) {
    const delta = prompt(`Adjust stock for ${item.sku} (positive to add, negative to subtract):`);
    if (delta === null) return;
    const qty = parseInt(delta, 10);
    if (isNaN(qty)) return;
    const note = prompt('Note (optional):') || undefined;
    this.http.post(`${environment.apiUrl}/admin/inventory/${item.variantId}/adjustments`, { quantityDelta: qty, note }).subscribe({
      next: () => { this.toast.success('Adjusted', 'Stock adjusted.'); this.load(); },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
