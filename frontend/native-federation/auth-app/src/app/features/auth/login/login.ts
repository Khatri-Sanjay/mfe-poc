import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  email = signal('');
  password = signal('');
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

  onSubmit(): void {
    if (!this.email() || !this.password()) {
      this.errorMessage.set('Please fill in all fields');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    this.authService
      .login({ email: this.email(), password: this.password() })
      .subscribe({
        next: (response) => {
          const user = response.data.user;
          const route = this.authService.getPostLoginRoute(user);
          this.router.navigateByUrl(route);
        },
        error: (err) => {
          this.isSubmitting.set(false);
          if (err.error?.errors) {
            this.errorMessage.set(err.error.errors[0].message);
          } else {
            this.errorMessage.set(
              err.error?.message || 'Login failed. Please try again.',
            );
          }
        },
      });
  }
}
