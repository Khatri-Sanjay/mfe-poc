import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-forgot-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  email = signal('');
  errorMessage = signal('');
  successMessage = signal('');
  isSubmitting = signal(false);

  constructor(private readonly authService: AuthService) {}

  onSubmit(): void {
    if (!this.email()) {
      this.errorMessage.set('Please enter your email address');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    this.authService.forgotPassword({ email: this.email() }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          'If an account exists with that email, you will receive a password reset link shortly.',
        );
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          err.error?.message || 'Something went wrong. Please try again.',
        );
      },
    });
  }
}
