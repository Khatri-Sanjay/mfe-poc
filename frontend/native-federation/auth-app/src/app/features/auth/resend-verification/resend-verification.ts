import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-resend-verification',
  imports: [FormsModule, RouterLink],
  templateUrl: './resend-verification.html',
  styleUrl: './resend-verification.css',
})
export class ResendVerification {
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

    this.authService.resendVerification({ email: this.email() }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.successMessage.set(
          'If an unverified account exists with that email, a new verification link has been sent.',
        );
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Something went wrong. Please try again.');
      },
    });
  }
}
