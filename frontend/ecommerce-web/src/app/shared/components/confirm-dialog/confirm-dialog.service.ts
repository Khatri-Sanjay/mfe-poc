import { Injectable, inject } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ConfirmDialogComponent } from './confirm-dialog.component';

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly modal = inject(NgbModal);

  async confirm(title: string, message: string, confirmLabel = 'Confirm'): Promise<boolean> {
    const ref = this.modal.open(ConfirmDialogComponent, { centered: true, backdrop: 'static' });
    ref.componentInstance.title = title;
    ref.componentInstance.message = message;
    ref.componentInstance.confirmLabel = confirmLabel;
    return ref.result.then(() => true).catch(() => false);
  }
}
