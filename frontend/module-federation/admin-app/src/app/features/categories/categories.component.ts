import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { Category } from '../../core/models/product.model';
import { ToastService } from '../../shared/components/toast/toast.service';

@Component({
  selector: 'app-categories',
  imports: [FormsModule],
  template: `
    <div class="admin-page-content">
      @if (showForm()) {
        <div class="form-section">
          <div class="resource-form">
            <label>
              Name
              <input type="text" [(ngModel)]="editForm.name" required placeholder="Category name" />
            </label>
            <label>
              Slug
              <input type="text" [(ngModel)]="editForm.slug" placeholder="auto-generated" />
            </label>
            <label>
              Parent
              <select [(ngModel)]="editForm.parentId">
                <option value="">None (Top Level)</option>
              @for (cat of categories(); track cat.id) {
                    <option [value]="cat.id">{{ cat.name }}</option>
                  }
              </select>
            </label>
            <label>
              Sort Order
              <input type="number" [(ngModel)]="editForm.sortOrder" min="0" />
            </label>
            <label class="span-2">
              Description
              <textarea [(ngModel)]="editForm.description" placeholder="Optional description"></textarea>
            </label>
            <div class="inline-actions">
              <button class="btn-primary compact" (click)="save()">{{ editingId() ? 'Update' : 'Create' }}</button>
              <button class="btn-secondary compact" (click)="cancelEdit()">Cancel</button>
            </div>
          </div>
        </div>
      }
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (categories().length === 0) {
        <div class="empty-state">
          <i class="bi bi-tags"></i>
          <h2>No categories yet</h2>
          <p>Create your first category to organize products.</p>
        </div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-6 header">
              <span>Name</span>
              <span>Slug</span>
              <span>Parent</span>
              <span>Sort</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
          </div>
          <div class="data-table-body">
            @for (cat of categories(); track cat.id) {
              <div class="data-row cols-6">
                <span>{{ cat.name }}</span>
                <span>{{ cat.slug }}</span>
                <span>{{ cat.parentId || '-' }}</span>
                <span>{{ cat.sortOrder }}</span>
                <span>
                  <span class="status" [class.stock]="cat.isActive" [class.in]="cat.isActive">
                    {{ cat.isActive ? 'Active' : 'Inactive' }}
                  </span>
                </span>
                <span class="table-actions">
                  <button class="icon-btn compact" (click)="edit(cat)"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn danger compact" (click)="delete(cat)"><i class="bi bi-trash"></i></button>
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
export class CategoriesComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  categories = signal<Category[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);

  editForm = { name: '', slug: '', description: '', parentId: '', sortOrder: 0 };

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading.set(true);
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => { this.categories.set(res.data ?? []); this.loading.set(false); },
      error: () => { this.toast.error('Error', 'Failed to load categories.'); this.loading.set(false); },
    });
  }

  edit(cat: Category) {
    this.editingId.set(cat.id);
    this.editForm = { name: cat.name, slug: cat.slug, description: cat.description || '', parentId: cat.parentId || '', sortOrder: cat.sortOrder };
    this.showForm.set(true);
  }

  cancelEdit() {
    this.editingId.set(null);
    this.editForm = { name: '', slug: '', description: '', parentId: '', sortOrder: 0 };
    this.showForm.set(false);
  }

  save() {
    if (!this.editForm.name) return;
    const body: any = {
      name: this.editForm.name,
      slug: this.editForm.slug || undefined,
      description: this.editForm.description || undefined,
      parentId: this.editForm.parentId || undefined,
      sortOrder: this.editForm.sortOrder,
    };
    const id = this.editingId();
    const req = id ? this.http.patch(`${environment.apiUrl}/admin/categories/${id}`, body) : this.http.post(`${environment.apiUrl}/admin/categories`, body);
    req.subscribe({
      next: () => { this.toast.success('Saved', 'Category saved.'); this.cancelEdit(); this.load(); },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }

  delete(cat: Category) {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/categories/${cat.id}`).subscribe({
      next: () => { this.toast.success('Deleted', 'Category deleted.'); this.load(); },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
