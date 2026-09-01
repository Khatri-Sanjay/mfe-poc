import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);
  private nextId = 0;

  show(type: Toast['type'], title: string, message: string) {
    const id = this.nextId++;
    this.toasts.update((t) => [...t, { id, type, title, message }]);
    setTimeout(() => this.dismiss(id), 5000);
  }

  success(title: string, message: string) {
    this.show('success', title, message);
  }

  error(title: string, message: string) {
    this.show('error', title, message);
  }

  warning(title: string, message: string) {
    this.show('warning', title, message);
  }

  dismiss(id: number) {
    this.toasts.update((t) => t.filter((toast) => toast.id !== id));
  }
}
