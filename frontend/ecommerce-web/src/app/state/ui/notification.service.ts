import { Injectable, signal } from '@angular/core';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notifications = signal<Notification[]>([]);
  private nextId = 1;

  success(message: string): void {
    this.push('success', message);
  }

  error(message: string): void {
    this.push('error', message);
  }

  warning(message: string): void {
    this.push('warning', message);
  }

  info(message: string): void {
    this.push('info', message);
  }

  remove(id: number): void {
    this.notifications.update((items) => items.filter((item) => item.id !== id));
  }

  private push(type: NotificationType, message: string): void {
    const notification = { id: this.nextId++, type, message };
    this.notifications.update((items) => [...items, notification]);
    setTimeout(() => this.remove(notification.id), 4500);
  }
}
