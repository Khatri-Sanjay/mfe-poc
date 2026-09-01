import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { NotificationService } from '../../state/ui/notification.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <p class="eyebrow">New customer</p>
      <h1>Create account</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <div class="form-grid">
          <label>First name <input formControlName="firstName" autocomplete="given-name" /></label>
          <label>Last name <input formControlName="lastName" autocomplete="family-name" /></label>
        </div>
        <label>Email <input type="email" formControlName="email" autocomplete="email" /></label>
        <label>Phone <input formControlName="phone" autocomplete="tel" /></label>
        <label>Password <input type="password" formControlName="password" autocomplete="new-password" /></label>
        <button class="btn-primary" type="submit" [disabled]="form.invalid || auth.loading()">Create account</button>
      </form>
      <a routerLink="/auth/login">Already have an account?</a>
    </section>
  `,
})
export class RegisterPage {
  readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly form = new FormGroup({
    firstName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    lastName: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.minLength(12), Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/)] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.auth.loading.set(true);
    try {
      const value = this.form.getRawValue();
      await this.auth.register({ ...value, phone: value.phone || undefined });
      this.notifications.success('Account created.');
      await this.router.navigate(['/products']);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Registration failed.');
    } finally {
      this.auth.loading.set(false);
    }
  }
}
