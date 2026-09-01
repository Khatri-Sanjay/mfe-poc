import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { ShippingMethod } from '../../core/models/shipping.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { MoneyPipe } from '../../shared/pipes/money.pipe';

@Component({
  selector: 'app-shipping',
  imports: [FormsModule, MoneyPipe],
  template: `
    <div class="admin-page-content">
      @if (showForm()) {
        <div class="form-section">
          <div class="resource-form">
            <label>Name <input type="text" [(ngModel)]="editForm.name" required placeholder="Standard Shipping" /></label>
            <label>Code <input type="text" [(ngModel)]="editForm.code" required placeholder="STANDARD" /></label>
            <label>Price <input type="text" [(ngModel)]="editForm.price" required placeholder="10.00" /></label>
            <label>Currency <input type="text" [(ngModel)]="editForm.currency" placeholder="AUD" /></label>
            <label>Min Days <input type="number" [(ngModel)]="editForm.estimatedMinDays" min="0" /></label>
            <label>Max Days <input type="number" [(ngModel)]="editForm.estimatedMaxDays" min="0" /></label>
            <label class="span-2">Description <textarea [(ngModel)]="editForm.description" placeholder="Optional description"></textarea></label>
            <div class="inline-actions">
              <button class="btn-primary compact" (click)="save()">{{ editingId() ? 'Update' : 'Create' }}</button>
              <button class="btn-secondary compact" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        </div>
      }
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (methods().length === 0) {
        <div class="empty-state"><i class="bi bi-truck"></i><h2>No shipping methods</h2></div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-6 header"><span>Name</span><span>Code</span><span>Price</span><span>Est. Days</span><span>Status</span><span>Actions</span></div>
          </div>
          <div class="data-table-body">
            @for (m of methods(); track m.id) {
              <div class="data-row cols-6">
                <span>{{ m.name }}</span>
                <span>{{ m.code }}</span>
                <span>{{ m.price | money }}</span>
                <span>{{ m.estimatedMinDays }}-{{ m.estimatedMaxDays }} days</span>
                <span><span class="status" [class.stock]="m.isActive" [class.in]="m.isActive">{{ m.isActive ? 'Active' : 'Inactive' }}</span></span>
                <span class="table-actions">
                  <button class="icon-btn compact" (click)="edit(m)"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn danger compact" (click)="delete(m)"><i class="bi bi-trash"></i></button>
                </span>
              </div>
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: `:host { display: contents; }`,
})
export class ShippingComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  methods = signal<ShippingMethod[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  editForm = { name: '', code: '', description: '', price: '', currency: 'AUD', estimatedMinDays: 3, estimatedMaxDays: 5 };

  ngOnInit() { this.load(); }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/shipping/methods`).subscribe({
      next: (res) => { this.methods.set(res.data ?? []); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  edit(m: ShippingMethod) {
    this.editingId.set(m.id);
    this.editForm = { name: m.name, code: m.code, description: m.description || '', price: m.price, currency: m.currency, estimatedMinDays: m.estimatedMinDays, estimatedMaxDays: m.estimatedMaxDays };
    this.showForm.set(true);
  }

  cancelEdit() { this.editingId.set(null); this.editForm = { name: '', code: '', description: '', price: '', currency: 'AUD', estimatedMinDays: 3, estimatedMaxDays: 5 }; this.showForm.set(false); }

  save() {
    if (!this.editForm.name || !this.editForm.code || !this.editForm.price) return;
    const id = this.editingId();
    const body: any = { ...this.editForm, description: this.editForm.description || undefined };
    const req = id ? this.http.patch(`${environment.apiUrl}/admin/shipping/methods/${id}`, body) : this.http.post(`${environment.apiUrl}/admin/shipping/methods`, body);
    req.subscribe({
      next: () => { this.toast.success('Saved', 'Shipping method saved.'); this.cancelEdit(); this.load(); },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }

  delete(m: ShippingMethod) {
    if (!confirm(`Delete "${m.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/shipping/methods/${m.id}`).subscribe({
      next: () => { this.toast.success('Deleted', 'Shipping method deleted.'); this.load(); },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
