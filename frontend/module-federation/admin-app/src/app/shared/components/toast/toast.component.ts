import { Component, inject } from '@angular/core';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-toast-stack',
  template: `
    <div class="toast-stack">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast-message" [class]="toast.type">
          <i class="bi"
            [class.bi-check-circle-fill]="toast.type === 'success'"
            [class.bi-exclamation-circle-fill]="toast.type === 'error'"
            [class.bi-exclamation-triangle-fill]="toast.type === 'warning'"
            [class.bi-info-circle-fill]="toast.type === 'info'"></i>
          <div class="toast-copy">
            <strong>{{ toast.title }}</strong>
            <span>{{ toast.message }}</span>
          </div>
          <button class="toast-close" (click)="toastService.dismiss(toast.id)">
            <i class="bi bi-x"></i>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toastService = inject(ToastService);
}
