import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/guards/permission.guard';
import { AdminLayoutComponent } from './admin-layout.component';
import { AdminPage } from './admin.page';
import { AdminResourcePage } from './admin-resource.page';

export default [
  {
    path: '',
    canActivate: [permissionGuard],
    component: AdminLayoutComponent,
    data: { permissions: ['product.read', 'order.read', 'user.read', 'inventory.read'] },
    children: [
      { path: '', component: AdminPage, data: { title: 'Admin Dashboard' } },
      { path: 'dashboard', component: AdminPage, data: { title: 'Admin Dashboard' } },
      { path: ':resource', component: AdminResourcePage, data: { title: 'Admin Resource' } },
    ],
  },
] satisfies Routes;
