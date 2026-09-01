import { Component, inject } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    <div class="modal-header">
      <h2 class="modal-title">{{ title }}</h2>
      <button class="btn-close" type="button" aria-label="Close" (click)="modal.dismiss()"></button>
    </div>
    <div class="modal-body">
      <p>{{ message }}</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" type="button" (click)="modal.dismiss()">Cancel</button>
      <button class="btn-danger-action" type="button" (click)="modal.close(true)">{{ confirmLabel }}</button>
    </div>
  `,
})
export class ConfirmDialogComponent {
  readonly modal = inject(NgbActiveModal);
  title = 'Confirm action';
  message = 'Are you sure you want to continue?';
  confirmLabel = 'Confirm';
}
