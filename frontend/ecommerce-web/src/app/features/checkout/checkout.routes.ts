import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { CheckoutPage } from './checkout.page';

export default [{ path: '', component: CheckoutPage, canActivate: [authGuard], data: { title: 'Checkout' } }] satisfies Routes;
