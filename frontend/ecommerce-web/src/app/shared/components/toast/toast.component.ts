import { Component, inject } from '@angular/core';
import { NotificationService } from '../../../state/ui/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-stack" aria-live="polite" aria-atomic="true">
      @for (notification of notifications.notifications(); track notification.id) {
        <article
          class="toast-message"
          [class.success]="notification.type === 'success'"
          [class.error]="notification.type === 'error'"
          [class.warning]="notification.type === 'warning'"
          [class.info]="notification.type === 'info'"
          role="status"
        >
          <i [class]="icon(notification.type)"></i>
          <div class="toast-copy">
            <strong>{{ title(notification.type) }}</strong>
            <span>{{ bodyLines(notification.message)[0] }}</span>
            @if (bodyLines(notification.message).slice(1); as details) {
              @if (details.length > 0) {
                <ul>
                  @for (line of details; track line) {
                    <li>{{ line }}</li>
                  }
                </ul>
              }
            }
            @if (reference(notification.message); as requestId) {
              <small>Reference: <code>{{ requestId }}</code></small>
            }
          </div>
          <button class="toast-close" type="button" aria-label="Dismiss notification" (click)="notifications.remove(notification.id)">
            <i class="bi bi-x-lg"></i>
          </button>
        </article>
      }
    </div>
  `,
})
export class ToastComponent {
  readonly notifications = inject(NotificationService);

  icon(type: string): string {
    if (type === 'success') return 'bi bi-check-circle';
    if (type === 'warning') return 'bi bi-exclamation-triangle';
    if (type === 'error') return 'bi bi-x-circle';
    return 'bi bi-info-circle';
  }

  title(type: string): string {
    if (type === 'success') return 'Success';
    if (type === 'warning') return 'Needs attention';
    if (type === 'error') return 'Unable to complete action';
    return 'Information';
  }

  body(message: string): string {
    return message.replace(/\s*Reference:\s*.+$/i, '').trim();
  }

  bodyLines(message: string): string[] {
    const lines = this.body(message)
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    return lines.length > 0 ? lines : ['Request failed. Please try again.'];
  }

  reference(message: string): string {
    const match = /Reference:\s*(.+)$/i.exec(message);
    return match?.[1]?.trim() ?? '';
  }
}
