import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { CartPage } from './cart.page';

export default [{ path: '', component: CartPage, canActivate: [authGuard], data: { title: 'Cart' } }] satisfies Routes;
