import { Routes } from '@angular/router';
import { AuthLayout } from './features/auth/auth-layout/auth-layout';
import { authGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayout,
    canActivate: [guestGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then((m) => m.Login),
        title: 'Sign In',
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then((m) => m.Register),
        title: 'Create Account',
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('./features/auth/forgot-password/forgot-password').then(
            (m) => m.ForgotPassword,
          ),
        title: 'Forgot Password',
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('./features/auth/reset-password/reset-password').then(
            (m) => m.ResetPassword,
          ),
        title: 'Reset Password',
      },
      {
        path: 'verify-email',
        loadComponent: () =>
          import('./features/auth/verify-email/verify-email').then(
            (m) => m.VerifyEmail,
          ),
        title: 'Verify Email',
      },
      {
        path: 'resend-verification',
        loadComponent: () =>
          import('./features/auth/resend-verification/resend-verification').then(
            (m) => m.ResendVerification,
          ),
        title: 'Resend Verification',
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
