import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Review } from '../../core/models/review.model';
import { ToastService } from '../../shared/components/toast/toast.service';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-reviews',
  imports: [PaginationComponent],
  template: `
    <div class="admin-page-content">
      @if (loading()) {
        <div class="skeleton-grid"><span></span><span></span><span></span></div>
      } @else if (reviews().length === 0) {
        <div class="empty-state">
          <i class="bi bi-star"></i>
          <h2>No reviews to moderate</h2>
        </div>
      } @else {
        <div class="data-table">
          <div class="data-table-header">
            <div class="data-row cols-5 header">
              <span>Product</span><span>Rating</span><span>Title</span><span>Status</span
              ><span>Actions</span>
            </div>
          </div>
          <div class="data-table-body">
            @for (r of reviews(); track r.id) {
              <div class="data-row cols-5">
                <span>{{ r.productId.substring(0, 8) }}...</span>
                <span
                  ><span class="rating"><i class="bi bi-star-fill"></i> {{ r.rating }}</span></span
                >
                <span>{{ r.title || '-' }}</span>
                <span
                  ><span class="status">{{ r.status }}</span></span
                >
                <span class="table-actions">
                  <button
                    class="icon-btn compact"
                    (click)="moderate(r, 'APPROVED')"
                    title="Approve"
                  >
                    <i class="bi bi-check-lg"></i>
                  </button>
                  <button
                    class="icon-btn danger compact"
                    (click)="moderate(r, 'REJECTED')"
                    title="Reject"
                  >
                    <i class="bi bi-x-lg"></i>
                  </button>
                  <button class="icon-btn danger compact" (click)="deleteReview(r)" title="Delete">
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
export class ReviewsComponent implements OnInit {
  private http = inject(HttpClient);
  private toast = inject(ToastService);
  reviews = signal<Review[]>([]);
  loading = signal(true);
  page = signal(1);
  limit = signal(10);
  total = signal(0);

  ngOnInit() {
    this.load();
  }

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
    this.http.get<any>(`${environment.apiUrl}/admin/reviews`, { params }).subscribe({
      next: (res) => {
        this.reviews.set(res.data ?? []);
        this.total.set(res.meta?.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  moderate(review: Review, status: string) {
    this.http
      .patch(`${environment.apiUrl}/admin/reviews/${review.id}/status`, { status })
      .subscribe({
        next: () => {
          this.toast.success('Updated', 'Review status updated.');
          this.load();
        },
        error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
      });
  }

  deleteReview(review: Review) {
    if (!confirm('Delete this review?')) return;
    this.http.delete(`${environment.apiUrl}/admin/reviews/${review.id}`).subscribe({
      next: () => {
        this.toast.success('Deleted', 'Review deleted.');
        this.load();
      },
      error: (err) => this.toast.error('Error', err.error?.message || 'Failed.'),
    });
  }
}
