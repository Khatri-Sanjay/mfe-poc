import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { MobileNavigationComponent } from '../mobile-navigation/mobile-navigation.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../state/cart/cart.facade';
import { WishlistFacade } from '../../features/wishlist/wishlist.facade';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MobileNavigationComponent, ToastComponent],
  template: `
    <app-header />
    <main class="page-shell">
      <router-outlet />
    </main>
    <app-footer />
    <app-mobile-navigation />
    <app-toast />
  `,
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly cart = inject(CartFacade);
  private readonly wishlist = inject(WishlistFacade);

  async ngOnInit(): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await Promise.all([this.auth.loadCurrentUser(), this.cart.load(), this.wishlist.load()]);
    }
  }
}
