import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../state/cart/cart.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { WishlistFacade } from '../wishlist/wishlist.facade';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <section class="auth-card">
      <p class="eyebrow">Welcome back</p>
      <h1>Sign in</h1>
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label>Email <input type="email" formControlName="email" autocomplete="email" /></label>
        <label>Password <input type="password" formControlName="password" autocomplete="current-password" /></label>
        <button class="btn-primary" type="submit" [disabled]="form.invalid || auth.loading()">Login</button>
      </form>
      <div class="auth-links">
        <a routerLink="/auth/register">Create account</a>
        <a routerLink="/auth/forgot-password">Forgot password</a>
      </div>
    </section>
  `,
})
export class LoginPage {
  readonly auth = inject(AuthFacade);
  private readonly cart = inject(CartFacade);
  private readonly wishlist = inject(WishlistFacade);
  private readonly router = inject(Router);
  private readonly notifications = inject(NotificationService);

  readonly form = new FormGroup({
    email: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  async submit(): Promise<void> {
    if (this.form.invalid) return;
    this.auth.loading.set(true);
    try {
      await this.auth.login(this.form.getRawValue());
      await Promise.all([this.cart.load(), this.wishlist.load()]);
      this.notifications.success('Signed in successfully.');
      await this.router.navigate(['/products']);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Login failed.');
    } finally {
      this.auth.loading.set(false);
    }
  }
}
