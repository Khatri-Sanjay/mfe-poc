import { Routes } from "@angular/router";
import { ShellComponent } from "./layout/shell/shell.component";
import { loadRemote } from '../federation-loader';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'login',
        redirectTo: '/auth/login',
        pathMatch: 'full',
      },
      {
        path: 'register',
        redirectTo: '/auth/register',
        pathMatch: 'full',
      },
      {
        path: 'forgot-password',
        redirectTo: '/auth/forgot-password',
        pathMatch: 'full',
      },
      {
        path: 'dashboard',
        redirectTo: '/auth/dashboard',
        pathMatch: 'full',
      },
      // Local routes
      {
        path: '',
        loadComponent: () => import('./features/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/catalog/product-list.page').then((m) => m.ProductListPage),
      },
      {
        path: 'products/:slug',
        loadComponent: () =>
          import('./features/catalog/product-detail.page').then((m) => m.ProductDetailPage),
      },
      {
        path: 'categories/:slug',
        loadComponent: () =>
          import('./features/catalog/product-list.page').then((m) => m.ProductListPage),
      },
      {
        path: 'brands/:slug',
        loadComponent: () =>
          import('./features/catalog/product-list.page').then((m) => m.ProductListPage),
      },
      {
        path: 'wishlist',
        loadComponent: () =>
          import('./features/wishlist/wishlist.page').then((m) => m.WishlistPage),
      },
      {
        path: 'cart',
        loadComponent: () => import('./features/cart/cart.page').then((m) => m.CartPage),
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/checkout/checkout.page').then((m) => m.CheckoutPage),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/order-list.page').then((m) => m.OrderListPage),
      },
      {
        path: 'orders/:id',
        loadComponent: () =>
          import('./features/orders/order-detail.page').then((m) => m.OrderDetailPage),
      },

      {
        path: 'auth',
        loadChildren: () =>
          loadRemote<{ routes: Routes }>('auth_app', './routes').then((m) => m.routes),
      },
      {
        path: 'admin',
        loadChildren: () =>
          loadRemote<{ routes: Routes }>('admin_app', './routes').then((m) => m.routes),
      },
    ],
  },
];
