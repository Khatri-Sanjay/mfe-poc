import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { AdminPreset, AdminService } from './admin.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="admin-page-content">
      <section class="resource-hero admin-dashboard-hero">
        <div>
          <p class="eyebrow">Commerce operations</p>
          <h1>Admin dashboard</h1>
          <p>Manage the backend resources that are available today. Missing analytics endpoints are called out instead of faking production data.</p>
        </div>
      </section>

      <div class="metric-grid">
        @for (metric of service.metrics(); track metric.label) {
          <article class="metric-card" [class.unavailable]="metric.status === 'unavailable'">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
          </article>
        }
      </div>

      <section class="admin-card-grid">
        @for (resource of service.resources; track resource.key) {
          @if (auth.hasAnyPermission(resource.permissions)) {
            <a class="admin-action-card" [routerLink]="['/admin', resource.key]">
              <i class="bi bi-arrow-up-right-square"></i>
              <strong>{{ resource.title }}</strong>
              <span>{{ resource.creatable ? 'Create, update, delete, and review records' : 'Review records and run supported actions' }}</span>
            </a>
          }
        }
      </section>

      <section class="surface admin-console">
        <h1>Admin API console</h1>
        <div class="preset-grid">
          @for (preset of service.presets; track preset.label) {
            @if (auth.hasAnyPermission(preset.permissions)) {
              <button class="btn-secondary compact" type="button" (click)="usePreset(preset)">{{ preset.label }}</button>
            }
          }
        </div>
        <form [formGroup]="form" (ngSubmit)="run()">
          <div class="console-row">
            <label>Method
              <select formControlName="method">
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </label>
            <label>Endpoint <input formControlName="path" placeholder="/admin/products?page=1&limit=20" /></label>
          </div>
          <label>JSON body <textarea formControlName="body"></textarea></label>
          <button class="btn-primary" type="submit" [disabled]="form.invalid">Run request</button>
        </form>
        <pre>{{ responseText() }}</pre>
      </section>
    </section>
  `,
})
export class AdminPage {
  readonly service = inject(AdminService);
  readonly auth = inject(AuthFacade);
  private readonly notifications = inject(NotificationService);
  readonly response = signal<unknown>(null);

  readonly form = new FormGroup({
    method: new FormControl<'GET' | 'POST' | 'PATCH' | 'DELETE'>('GET', { nonNullable: true }),
    path: new FormControl('/admin/products?page=1&limit=20', { nonNullable: true, validators: [Validators.required] }),
    body: new FormControl('', { nonNullable: true }),
  });

  usePreset(preset: AdminPreset): void {
    this.form.setValue({
      method: preset.method,
      path: preset.path,
      body: preset.body ? JSON.stringify(preset.body, null, 2) : '',
    });
  }

  async run(): Promise<void> {
    const value = this.form.getRawValue();
    try {
      const body = value.body.trim() ? JSON.parse(value.body) : undefined;
      this.response.set(await this.service.run(value.method, value.path, body));
      this.notifications.success('Admin request completed.');
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Admin request failed.');
    }
  }

  responseText(): string {
    return this.response() ? JSON.stringify(this.response(), null, 2) : 'No response yet.';
  }
}
