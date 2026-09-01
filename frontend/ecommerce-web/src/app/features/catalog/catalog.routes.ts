import { Routes } from '@angular/router';
import { ProductListPage } from './product-list.page';
import { ProductDetailPage } from './product-detail.page';

export default [
  { path: '', component: ProductListPage, data: { title: 'Products' } },
  { path: ':slug', component: ProductDetailPage, data: { title: 'Product Details' } },
] satisfies Routes;
