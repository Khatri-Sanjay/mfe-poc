import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Coupon } from '../../core/models/coupon.model';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-coupons',
  imports: [FormsModule],
  template: `
    <div class="admin-page-content">
      @if (showForm()) {
        <div class="form-section">
          <div class="resource-form">
            <label
              >Code <input type="text" [(ngModel)]="editForm.code" required placeholder="SAVE10"
            /></label>
            <label
              >Type
              <select [(ngModel)]="editForm.type">
                <option value="PERCENTAGE">Percentage</option>
                <option value="FIXED_AMOUNT">Fixed Amount</option>
              </select>
            </label>
            <label
              >Value <input type="text" [(ngModel)]="editForm.value" required placeholder="10.00"
            /></label>
            <label
              >Min Order
              <input type="text" [(ngModel)]="editForm.minimumOrderAmount" placeholder="0.00"
            /></label>
            <label
              >Max Discount
              <input type="text" [(ngModel)]="editForm.maximumDiscountAmount" placeholder="100.00"
            /></label>
            <label
              >Usage Limit <input type="number" [(ngModel)]="editForm.usageLimit" min="1"
            /></label>
            <label
              >Usage Limit Per User
              <input type="number" [(ngModel)]="editForm.usageLimitPerUser" min="1"
            /></label>
            <label>Starts At <input type="datetime-local" [(ngModel)]="editForm.startsAt" /></label>
            <label
              >Expires At <input type="datetime-local" [(ngModel)]="editForm.expiresAt"
            /></label>
            <div class="inline-actions">
              <button class="btn-primary compact" (click)="save()">
                {{ editingId() ? 'Update' : 'Create' }}
              </button>
              <button class="btn-secondary compact" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        </div>
      }
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (coupons().length === 0) {
        <div class="empty-state">
          <i class="bi bi-percent"></i>
          <h2>No coupons yet</h2>
        </div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-6 header">
              <span>Code</span><span>Type</span><span>Value</span><span>Used</span
              ><span>Status</span><span>Actions</span>
            </div>
          </div>
          <div class="data-table-body">
            @for (c of coupons(); track c.id) {
              <div class="data-row cols-6">
                <span>{{ c.code }}</span>
                <span>{{ c.type }}</span>
                <span>{{ c.value }}{{ c.type === 'PERCENTAGE' ? '%' : '' }}</span>
                <span>{{ c.usageCount }}{{ c.usageLimit ? ' / ' + c.usageLimit : '' }}</span>
                <span
                  ><span class="status" [class.stock]="c.isActive" [class.in]="c.isActive">{{
                    c.isActive ? 'Active' : 'Inactive'
                  }}</span></span
                >
                <span class="table-actions">
                  <button class="icon-btn compact" (click)="edit(c)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="icon-btn danger compact" (click)="delete(c)">
                    <i class="bi bi-trash"></i>
                  </button>
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class CouponsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  coupons = signal<Coupon[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  editForm = {
    code: '',
    type: 'PERCENTAGE',
    value: '',
    minimumOrderAmount: '',
    maximumDiscountAmount: '',
    usageLimit: 100,
    usageLimitPerUser: 1,
    startsAt: '',
    expiresAt: '',
  };

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/admin/coupons`).subscribe({
      next: (res) => {
        this.coupons.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  edit(c: Coupon) {
    this.editingId.set(c.id);
    this.editForm = {
      code: c.code,
      type: c.type,
      value: c.value,
      minimumOrderAmount: c.minimumOrderAmount || '',
      maximumDiscountAmount: c.maximumDiscountAmount || '',
      usageLimit: c.usageLimit || 100,
      usageLimitPerUser: c.usageLimitPerUser || 1,
      startsAt: c.startsAt ? c.startsAt.substring(0, 16) : '',
      expiresAt: c.expiresAt ? c.expiresAt.substring(0, 16) : '',
    };
    this.showForm.set(true);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm = {
      code: '',
      type: 'PERCENTAGE',
      value: '',
      minimumOrderAmount: '',
      maximumDiscountAmount: '',
      usageLimit: 100,
      usageLimitPerUser: 1,
      startsAt: '',
      expiresAt: '',
    };
    this.showForm.set(false);
  }

  save() {
    if (!this.editForm.code || !this.editForm.value) return;
    const id = this.editingId();
    const body: any = {
      ...this.editForm,
      minimumOrderAmount: this.editForm.minimumOrderAmount || undefined,
      maximumDiscountAmount: this.editForm.maximumDiscountAmount || undefined,
      usageLimitPerUser: this.editForm.usageLimitPerUser || undefined,
      startsAt: this.editForm.startsAt || undefined,
      expiresAt: this.editForm.expiresAt || undefined,
    };
    const req = id
      ? this.http.patch(`${environment.apiUrl}/admin/coupons/${id}`, body)
      : this.http.post(`${environment.apiUrl}/admin/coupons`, body);
    req.subscribe({
      next: () => {
        this.toast.success('Saved', 'Coupon saved.');
        this.cancelEdit();
        this.load();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }

  delete(c: Coupon) {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/coupons/${c.id}`).subscribe({
      next: () => {
        this.toast.success('Deleted', 'Coupon deleted.');
        this.load();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
