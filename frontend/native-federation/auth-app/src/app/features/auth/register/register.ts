import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  firstName = signal('');
  lastName = signal('');
  email = signal('');
  phone = signal('');
  password = signal('');
  confirmPassword = signal('');
  showPassword = signal(false);
  errorMessage = signal('');
  isSubmitting = signal(false);

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  passwordsMatch(): boolean {
    return this.password() === this.confirmPassword();
  }

  getPasswordError(): string {
    if (!this.password()) return '';
    if (this.password().length < 12) return 'Password must be at least 12 characters';
    if (!/[a-z]/.test(this.password())) return 'Password must contain a lowercase letter';
    if (!/[A-Z]/.test(this.password())) return 'Password must contain an uppercase letter';
    if (!/\d/.test(this.password())) return 'Password must contain a number';
    return '';
  }

  onSubmit(): void {
    this.errorMessage.set('');

    if (!this.firstName() || !this.lastName() || !this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all required fields');
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
      .register({
        firstName: this.firstName(),
        lastName: this.lastName(),
        email: this.email(),
        phone: this.phone() || undefined,
        password: this.password(),
      })
      .subscribe({
        next: (response) => {
          const user = response.data.user;
          const route = this.authService.getPostLoginRoute(user);
          this.router.navigateByUrl(route);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(err.error?.message || 'Registration failed. Please try again.');
        },
      });
  }
}
