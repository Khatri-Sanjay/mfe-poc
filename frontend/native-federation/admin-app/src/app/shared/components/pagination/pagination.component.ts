import { Component, input, output } from '@angular/core';

export interface PaginationState {
  page: number;
  limit: number;
  total: number;
}

@Component({
  selector: 'app-pagination',
  template: `
    <div class="pagination-bar">
      <span class="pagination-info">
        Showing {{ startItem() }}–{{ endItem() }} of {{ total() }}
      </span>
      <div class="pagination-controls">
        <button class="icon-btn compact" [disabled]="page() <= 1" (click)="goTo.emit(page() - 1)">
          <i class="bi bi-chevron-left"></i>
        </button>
        @for (p of visiblePages(); track p) {
          <button
            class="icon-btn compact"
            [class.active]="p === page()"
            (click)="goTo.emit(p)"
          >{{ p }}</button>
        }
        <button class="icon-btn compact" [disabled]="page() >= totalPages()" (click)="goTo.emit(page() + 1)">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    </div>
  `,
  styles: `
    :host { display: block; }
  `,
})
export class PaginationComponent {
  page = input.required<number>();
  limit = input.required<number>();
  total = input.required<number>();
  goTo = output<number>();

  totalPages = () => Math.max(1, Math.ceil(this.total() / this.limit()));
  startItem = () => this.total() === 0 ? 0 : (this.page() - 1) * this.limit() + 1;
  endItem = () => Math.min(this.page() * this.limit(), this.total());

  visiblePages = () => {
    const total = this.totalPages();
    const current = this.page();
    const pages: number[] = [];
    let start = Math.max(1, current - 2);
    let end = Math.min(total, current + 2);
    if (end - start < 4) {
      if (start === 1) end = Math.min(total, start + 4);
      else start = Math.max(1, end - 4);
    }
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  };
}
