import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';
import { WishlistPage } from './wishlist.page';

export default [{ path: '', component: WishlistPage, canActivate: [authGuard], data: { title: 'Wishlist' } }] satisfies Routes;
