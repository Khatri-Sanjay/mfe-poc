import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', loadChildren: () => import('./features/home/home.routes') },
      { path: 'products', loadChildren: () => import('./features/catalog/catalog.routes') },
      { path: 'categories/:slug', loadChildren: () => import('./features/catalog/catalog.routes') },
      { path: 'brands/:slug', loadChildren: () => import('./features/catalog/catalog.routes') },
      { path: 'cart', loadChildren: () => import('./features/cart/cart.routes') },
      { path: 'checkout', loadChildren: () => import('./features/checkout/checkout.routes') },
      { path: 'orders', loadChildren: () => import('./features/orders/orders.routes') },
      { path: 'account', loadChildren: () => import('./features/account/account.routes') },
      { path: 'wishlist', loadChildren: () => import('./features/wishlist/wishlist.routes') },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes') },
      { path: 'auth', loadChildren: () => import('./features/auth/auth.routes') },
    ],
  },
  { path: '**', redirectTo: '' },
];
