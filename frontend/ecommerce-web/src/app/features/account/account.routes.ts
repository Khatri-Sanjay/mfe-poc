import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { AccountPage } from './account.page';

export default [
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'profile' },
      { path: 'profile', component: AccountPage, data: { title: 'Profile', tab: 'profile' } },
      { path: 'addresses', component: AccountPage, data: { title: 'Addresses', tab: 'addresses' } },
      { path: 'security', component: AccountPage, data: { title: 'Security', tab: 'security' } },
      { path: 'wishlist', loadChildren: () => import('../wishlist/wishlist.routes') },
    ],
  },
] satisfies Routes;
