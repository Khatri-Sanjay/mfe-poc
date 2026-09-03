import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AdminLayoutComponent } from './layout/admin-layout/admin-layout.component';
import { loadRemote } from '../federation-loader';

export const routes: Routes = [
  // Remote auth routes — loaded from auth-app via Native Federation
  {
    path: 'auth',
    loadChildren: () =>
      loadRemote<{ routes: Routes }>('auth_app', './routes').then((m) => m.routes),
  },

  // Admin routes (protected)
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'insights',
        loadComponent: () =>
          import('./features/django-insights/django-insights.component').then(
            (m) => m.DjangoInsightsComponent,
          ),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/product-manager-remote/product-manager-remote.component').then(
            (m) => m.ProductManagerRemoteComponent,
          ),
      },
      {
        path: 'products/new',
        loadComponent: () =>
          import('./features/products/product-manager-remote/product-manager-remote.component').then(
            (m) => m.ProductManagerRemoteComponent,
          ),
      },
      {
        path: 'products/:id/edit',
        loadComponent: () =>
          import('./features/products/product-manager-remote/product-manager-remote.component').then(
            (m) => m.ProductManagerRemoteComponent,
          ),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'brands',
        loadComponent: () =>
          import('./features/brands/brands.component').then((m) => m.BrandsComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./features/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
      },
      {
        path: 'reviews',
        loadComponent: () =>
          import('./features/reviews/reviews.component').then((m) => m.ReviewsComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
      },
      {
        path: 'coupons',
        loadComponent: () =>
          import('./features/coupons/coupons.component').then((m) => m.CouponsComponent),
      },
      {
        path: 'shipping',
        loadComponent: () =>
          import('./features/shipping/shipping.component').then((m) => m.ShippingComponent),
      },
      {
        path: 'seed-data',
        loadComponent: () =>
          import('./features/seed-data/seed-data.component').then((m) => m.SeedDataComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
