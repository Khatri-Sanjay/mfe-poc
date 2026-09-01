import { Component, input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  template: `
    <div class="empty-state">
      <i class="bi bi-inbox"></i>
      <h3>{{ title() }}</h3>
      <p>{{ message() }}</p>
      <ng-content />
    </div>
  `,
  styles: `
    .empty-state {
      display: grid;
      gap: 0.65rem;
      justify-items: center;
      padding: 3rem 1rem;
      border: 2px dashed var(--color-border);
      border-radius: var(--radius-lg);
      text-align: center;
    }
    .empty-state i {
      font-size: 2.5rem;
      color: var(--color-text-muted);
    }
    .empty-state h3 {
      margin: 0;
      font-size: 1.1rem;
      font-weight: 900;
    }
    .empty-state p {
      margin: 0;
      color: var(--color-text-muted);
      font-size: 0.92rem;
    }
  `,
})
export class EmptyStateComponent {
  readonly title = input('Nothing here');
  readonly message = input('');
}
