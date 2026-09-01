import { Injectable, signal } from '@angular/core';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);

  success(message: string): void {
    this.add('success', message);
  }

  error(message: string): void {
    this.add('error', message);
  }

  warning(message: string): void {
    this.add('warning', message);
  }

  info(message: string): void {
    this.add('info', message);
  }

  dismiss(id: string): void {
    this.notifications.update((list) => list.filter((n) => n.id !== id));
  }

  private add(type: Notification['type'], message: string): void {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.notifications.update((list) => [...list, { id, type, message }]);
    setTimeout(() => this.dismiss(id), 4500);
  }
}
