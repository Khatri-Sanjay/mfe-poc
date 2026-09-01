import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Brand } from '../../core/models/product.model';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-brands',
  imports: [FormsModule],
  template: `
    <div class="admin-page-content">
      @if (showForm()) {
        <div class="form-section">
          <div class="resource-form">
            <label
              >Name
              <input type="text" [(ngModel)]="editForm.name" required placeholder="Brand name"
            /></label>
            <label
              >Slug <input type="text" [(ngModel)]="editForm.slug" placeholder="auto-generated"
            /></label>
            <label
              >Website
              <input type="text" [(ngModel)]="editForm.websiteUrl" placeholder="https://..."
            /></label>
            <label
              >Logo URL <input type="text" [(ngModel)]="editForm.logoUrl" placeholder="https://..."
            /></label>
            <label class="span-2"
              >Description
              <textarea
                [(ngModel)]="editForm.description"
                placeholder="Optional description"
              ></textarea>
            </label>
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
      } @else if (brands().length === 0) {
        <div class="empty-state">
          <i class="bi bi-award"></i>
          <h2>No brands yet</h2>
        </div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-5 header">
              <span>Name</span><span>Slug</span><span>Website</span><span>Status</span
              ><span>Actions</span>
            </div>
          </div>
          <div class="data-table-body">
            @for (b of brands(); track b.id) {
              <div class="data-row cols-5">
                <span>{{ b.name }}</span>
                <span>{{ b.slug }}</span>
                <span>{{ b.websiteUrl || '-' }}</span>
                <span
                  ><span class="status" [class.stock]="b.isActive" [class.in]="b.isActive">{{
                    b.isActive ? 'Active' : 'Inactive'
                  }}</span></span
                >
                <span class="table-actions">
                  <button class="icon-btn compact" (click)="edit(b)">
                    <i class="bi bi-pencil"></i>
                  </button>
                  <button class="icon-btn danger compact" (click)="delete(b)">
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
export class BrandsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  brands = signal<Brand[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  editForm = { name: '', slug: '', description: '', websiteUrl: '', logoUrl: '' };

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/brands`).subscribe({
      next: (res) => {
        this.brands.set(res.data ?? []);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  edit(b: Brand) {
    this.editingId.set(b.id);
    this.editForm = {
      name: b.name,
      slug: b.slug,
      description: b.description || '',
      websiteUrl: b.websiteUrl || '',
      logoUrl: b.logoUrl || '',
    };
    this.showForm.set(true);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm = { name: '', slug: '', description: '', websiteUrl: '', logoUrl: '' };
    this.showForm.set(false);
  }

  save() {
    if (!this.editForm.name) return;
    const body: any = {
      name: this.editForm.name,
      slug: this.editForm.slug || undefined,
      description: this.editForm.description || undefined,
      websiteUrl: this.editForm.websiteUrl || undefined,
      logoUrl: this.editForm.logoUrl || undefined,
    };
    const id = this.editingId();
    const req = id
      ? this.http.patch(`${environment.apiUrl}/admin/brands/${id}`, body)
      : this.http.post(`${environment.apiUrl}/admin/brands`, body);
    req.subscribe({
      next: () => {
        this.toast.success('Saved', 'Brand saved.');
        this.cancelEdit();
        this.load();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }

  delete(b: Brand) {
    if (!confirm(`Delete "${b.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/brands/${b.id}`).subscribe({
      next: () => {
        this.toast.success('Deleted', 'Brand deleted.');
        this.load();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
