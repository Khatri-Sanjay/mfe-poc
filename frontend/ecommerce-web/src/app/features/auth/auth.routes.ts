import { Routes } from '@angular/router';
import { LoginPage } from './login.page';
import { RegisterPage } from './register.page';
import { PasswordRecoveryPage } from './password-recovery.page';

export default [
  { path: 'login', component: LoginPage, data: { title: 'Login' } },
  { path: 'register', component: RegisterPage, data: { title: 'Register' } },
  { path: 'forgot-password', component: PasswordRecoveryPage, data: { title: 'Recover Password' } },
  { path: 'reset-password', component: PasswordRecoveryPage, data: { title: 'Reset Password' } },
  { path: 'verify-email', component: PasswordRecoveryPage, data: { title: 'Verify Email' } },
] satisfies Routes;
