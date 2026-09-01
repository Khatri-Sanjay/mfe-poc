import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment';
import { User } from '../../core/models/auth.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-users',
  imports: [FormsModule, PaginationComponent],
  template: `
    <div class="admin-page-content">
      @if (showForm()) {
        <div class="form-section">
          <div class="resource-form">
            <label>First Name <input type="text" [(ngModel)]="editForm.firstName" required /></label>
            <label>Last Name <input type="text" [(ngModel)]="editForm.lastName" required /></label>
            <label>Email <input type="email" [(ngModel)]="editForm.email" required /></label>
            <label>Phone <input type="text" [(ngModel)]="editForm.phone" /></label>
            @if (!editingId()) {
              <label>Password <input type="password" [(ngModel)]="editForm.password" required /></label>
            }
            <label>Roles <input type="text" [(ngModel)]="editForm.roles" placeholder="comma-separated" /></label>
            <label>Status
              <select [(ngModel)]="editForm.status">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
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
      } @else if (users().length === 0) {
        <div class="empty-state"><i class="bi bi-people"></i><h2>No users yet</h2></div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-5 header"><span>Name</span><span>Email</span><span>Roles</span><span>Status</span><span>Actions</span></div>
          </div>
          <div class="data-table-body">
            @for (u of users(); track u.id) {
              <div class="data-row cols-5">
                <span>{{ u.firstName }} {{ u.lastName }}</span>
                <span>{{ u.email }}</span>
                <span>{{ u.roles.join(', ') }}</span>
                <span><span class="status" [class.stock]="u.status === 'ACTIVE'" [class.in]="u.status === 'ACTIVE'" [class.out]="u.status === 'SUSPENDED'">{{ u.status }}</span></span>
                <span class="table-actions">
                  <button class="icon-btn compact" (click)="edit(u)"><i class="bi bi-pencil"></i></button>
                  <button class="icon-btn danger compact" (click)="deleteUser(u)"><i class="bi bi-trash"></i></button>
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
export class UsersComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  users = signal<User[]>([]);
  loading = signal(true);
  showForm = signal(false);
  editingId = signal<string | null>(null);
  page = signal(1);
  limit = signal(10);
  total = signal(0);
  editForm = { firstName: '', lastName: '', email: '', phone: '', password: '', status: 'ACTIVE', roles: '' };

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
      sortOrder: 'desc',
    };
    this.http.get<any>(`${environment.apiUrl}/admin/users`, { params }).subscribe({
      next: (res) => {
        this.users.set(res.data ?? []);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); },
    });
  }

  edit(u: User) {
    this.editingId.set(u.id);
    this.editForm = { firstName: u.firstName, lastName: u.lastName, email: u.email, phone: u.phone || '', password: '', status: u.status, roles: u.roles.join(', ') };
    this.showForm.set(true);
  }

  cancelEdit() { this.editingId.set(null); this.editForm = { firstName: '', lastName: '', email: '', phone: '', password: '', status: 'ACTIVE', roles: '' }; this.showForm.set(false); }

  save() {
    if (!this.editForm.firstName || !this.editForm.email) return;
    const id = this.editingId();
    if (id) {
      const profileBody: any = {
        firstName: this.editForm.firstName,
        lastName: this.editForm.lastName,
        email: this.editForm.email,
        phone: this.editForm.phone || undefined,
      };
      this.http.patch(`${environment.apiUrl}/admin/users/${id}`, profileBody).subscribe({
        next: () => {
          this.http.patch(`${environment.apiUrl}/admin/users/${id}/status`, { status: this.editForm.status }).subscribe({
            next: () => {
              const roles = this.editForm.roles.split(',').map(r => r.trim()).filter(Boolean);
              this.http.patch(`${environment.apiUrl}/admin/users/${id}/roles`, { roles }).subscribe({
                next: () => { this.toast.success('Saved', 'User saved.'); this.cancelEdit(); this.load(); },
                error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
              });
            },
            error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
          });
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
      });
    } else {
      const body: any = {
        firstName: this.editForm.firstName,
        lastName: this.editForm.lastName,
        email: this.editForm.email,
        phone: this.editForm.phone || undefined,
        password: this.editForm.password,
        status: this.editForm.status,
      };
      this.http.post(`${environment.apiUrl}/admin/users`, body).subscribe({
        next: () => { this.toast.success('Saved', 'User saved.'); this.cancelEdit(); this.load(); },
        error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
      });
    }
  }

  deleteUser(u: User) {
    if (!confirm(`Delete "${u.firstName} ${u.lastName}"?`)) return;
    this.http.delete(`${environment.apiUrl}/admin/users/${u.id}`).subscribe({
      next: () => { this.toast.success('Deleted', 'User deleted.'); this.load(); },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
