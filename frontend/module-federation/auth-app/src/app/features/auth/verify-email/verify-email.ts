import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-verify-email',
  imports: [RouterLink],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  errorMessage = signal('');
  successMessage = signal('');
  isVerifying = signal(false);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.verifyToken(token);
    } else {
      this.errorMessage.set('No verification token found. Please check your email for the verification link.');
    }
  }

  private verifyToken(token: string): void {
    this.isVerifying.set(true);

    this.authService.verifyEmail({ token }).subscribe({
      next: () => {
        this.isVerifying.set(false);
        this.successMessage.set('Email verified successfully! You can now sign in.');
      },
      error: (err) => {
        this.isVerifying.set(false);
        this.errorMessage.set(
          err.error?.message || 'Verification failed. The link may have expired or already been used.',
        );
      },
    });
  }
}
