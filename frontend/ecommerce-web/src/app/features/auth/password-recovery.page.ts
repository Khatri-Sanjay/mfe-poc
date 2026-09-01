import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../state/ui/notification.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="auth-card">
      <p class="eyebrow">Account access</p>
      <h1>{{ title }}</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email <input type="email" formControlName="email" autocomplete="email" /></label>
        <label>Token <input formControlName="token" /></label>
        <label>New password <input type="password" formControlName="newPassword" autocomplete="new-password" /></label>
        <button class="btn-primary" type="submit">Submit</button>
      </form>
    </section>
  `,
})
export class PasswordRecoveryPage {
  private readonly service = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  readonly title = this.route.snapshot.routeConfig?.path === 'verify-email' ? 'Verify email' : 'Password recovery';

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.email] }),
    token: new FormControl('', { nonNullable: true }),
    newPassword: new FormControl('', { nonNullable: true, validators: [Validators.minLength(12)] }),
  });

  async submit(): Promise<void> {
    const path = this.route.snapshot.routeConfig?.path;
    const value = this.form.getRawValue();
    try {
      if (path === 'forgot-password') await this.service.forgotPassword(value.email);
      if (path === 'reset-password') await this.service.resetPassword(value.token, value.newPassword);
      if (path === 'verify-email') await this.service.verifyEmail(value.token);
      this.notifications.success('Request completed.');
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Request failed.');
    }
  }
}
