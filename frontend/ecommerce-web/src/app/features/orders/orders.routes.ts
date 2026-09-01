import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { OrderDetailPage } from './order-detail.page';
import { OrdersPage } from './orders.page';

export default [
  { path: '', component: OrdersPage, canActivate: [authGuard], data: { title: 'Orders' } },
  { path: ':id', component: OrderDetailPage, canActivate: [authGuard], data: { title: 'Order Details' } },
] satisfies Routes;
