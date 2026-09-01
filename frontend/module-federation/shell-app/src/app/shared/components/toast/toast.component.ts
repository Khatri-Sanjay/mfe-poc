import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../state/ui/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack">
      @for (n of notifications.notifications(); track n.id) {
        <div class="toast-item" [class]="'toast-' + n.type">
          <div class="toast-icon">
            @switch (n.type) {
              @case ('success') { <i class="bi bi-check-circle-fill"></i> }
              @case ('error') { <i class="bi bi-x-circle-fill"></i> }
              @case ('warning') { <i class="bi bi-exclamation-triangle-fill"></i> }
              @case ('info') { <i class="bi bi-info-circle-fill"></i> }
            }
          </div>
          <div class="toast-copy">
            <span>{{ n.message }}</span>
          </div>
          <button class="toast-close" type="button" (click)="notifications.dismiss(n.id)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toast-stack {
      position: fixed;
      top: 5rem;
      right: 1rem;
      z-index: 80;
      display: grid;
      gap: 0.65rem;
      width: 22rem;
      max-width: calc(100vw - 2rem);
    }
    .toast-item {
      display: flex;
      align-items: start;
      gap: 0.65rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: #fff;
      padding: 0.85rem;
      box-shadow: var(--shadow-md);
    }
    .toast-icon {
      flex-shrink: 0;
      font-size: 1.1rem;
      line-height: 1.2;
    }
    .toast-success .toast-icon { color: var(--color-success); }
    .toast-error .toast-icon { color: var(--color-danger); }
    .toast-warning .toast-icon { color: var(--color-warning); }
    .toast-info .toast-icon { color: var(--color-info); }
    .toast-copy {
      flex: 1;
      min-width: 0;
    }
    .toast-copy span {
      color: var(--color-text-secondary);
      font-size: 0.86rem;
      font-weight: 650;
      line-height: 1.35;
    }
    .toast-close {
      flex-shrink: 0;
      display: inline-grid;
      width: 1.85rem;
      height: 1.85rem;
      place-items: center;
      border: 0;
      border-radius: var(--radius-sm);
      background: transparent;
      color: var(--color-text-muted);
    }
    .toast-close:hover {
      background: rgba(15, 23, 42, 0.06);
      color: var(--color-text-primary);
    }
  `,
})
export class ToastComponent {
  readonly notifications = inject(NotificationService);
}
