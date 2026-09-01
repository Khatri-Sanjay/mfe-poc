import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { AdminResourceConfig } from '../admin.service';

@Component({
  selector: 'app-admin-resource-table',
  standalone: true,
  imports: [FormsModule, EmptyStateComponent],
  template: `
    <div class="surface resource-table-card">
      <div class="admin-toolbar">
        <label class="sr-only" for="resource-search">Search rows</label>
        <input id="resource-search" [ngModel]="search" (ngModelChange)="searchChange.emit($event)" placeholder="Search loaded records" />
        <span class="record-count">{{ rows.length }} records</span>
      </div>

      @if (allRows.length === 0) {
        <app-empty-state title="No records loaded" message="This backend endpoint returned no rows.">
          <button class="btn-secondary mt-3" type="button" (click)="refresh.emit()">Try again</button>
        </app-empty-state>
      } @else {
        <div class="data-table" role="table" [attr.aria-label]="resource.title + ' table'">
          <div class="data-row header" role="row">
            @for (column of columns; track column) {
              <span role="columnheader">{{ label(column) }}</span>
            }
            <span role="columnheader">Actions</span>
          </div>
          @for (row of rows; track idOf(row)) {
            <div class="data-row" role="row">
              @for (column of columns; track column) {
                <span role="cell" [title]="display(row, column)">{{ display(row, column) }}</span>
              }
              <span class="table-actions" role="cell">
                @if (resource.editable) {
                  <button class="btn-secondary compact" type="button" (click)="edit.emit(row)">
                    <i class="bi bi-pencil-square"></i> Edit
                  </button>
                }
                @if (resource.deletable) {
                  <button class="btn-secondary compact danger-text" type="button" (click)="remove.emit(row)">
                    <i class="bi bi-trash"></i> Delete
                  </button>
                }
              </span>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class AdminResourceTableComponent {
  @Input({ required: true }) resource!: AdminResourceConfig;
  @Input() allRows: Record<string, unknown>[] = [];
  @Input() rows: Record<string, unknown>[] = [];
  @Input() columns: string[] = [];
  @Input() search = '';
  @Output() searchChange = new EventEmitter<string>();
  @Output() refresh = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Record<string, unknown>>();
  @Output() remove = new EventEmitter<Record<string, unknown>>();

  label(column: string): string {
    return column.replace(/([A-Z])/g, ' $1').replace(/^./, (value) => value.toUpperCase());
  }

  display(row: Record<string, unknown>, column: string): string {
    const value = row[column];
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  idOf(row: Record<string, unknown>): string {
    const id = row['id'] ?? row['variantId'];
    return typeof id === 'string' ? id : JSON.stringify(row);
  }
}
