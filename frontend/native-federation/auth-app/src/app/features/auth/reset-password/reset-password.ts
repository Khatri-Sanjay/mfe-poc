import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  token = signal('');
  newPassword = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  errorMessage = signal('');
  successMessage = signal('');
  isSubmitting = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.token.set(token);
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  passwordsMatch(): boolean {
    return this.newPassword() === this.confirmPassword();
  }

  getPasswordError(): string {
    if (!this.newPassword()) return '';
    if (this.newPassword().length < 12) return 'Password must be at least 12 characters';
    if (!/[a-z]/.test(this.newPassword())) return 'Password must contain a lowercase letter';
    if (!/[A-Z]/.test(this.newPassword())) return 'Password must contain an uppercase letter';
    if (!/\d/.test(this.newPassword())) return 'Password must contain a number';
    return '';
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.token()) {
      this.errorMessage.set('Invalid or missing reset token');
      return;
    }

    if (!this.newPassword()) {
      this.errorMessage.set('Please enter a new password');
      return;
    }

    if (!this.passwordsMatch()) {
      this.errorMessage.set('Passwords do not match');
      return;
    }

    const passwordError = this.getPasswordError();
    if (passwordError) {
      this.errorMessage.set(passwordError);
      return;
    }

    this.isSubmitting.set(true);

    this.authService
      .resetPassword({
        token: this.token(),
        newPassword: this.newPassword(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.successMessage.set('Password reset successfully! Redirecting to login...');
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 3000);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(
            err.error?.message || 'Failed to reset password. The link may have expired.',
          );
        },
      });
  }
}
