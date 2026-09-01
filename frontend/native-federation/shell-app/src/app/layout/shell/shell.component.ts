import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { MobileNavigationComponent } from '../mobile-navigation/mobile-navigation.component';
import { ToastComponent } from '../../shared/components/toast/toast.component';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../features/cart/cart.facade';
import { WishlistFacade } from '../../features/wishlist/wishlist.facade';
import { filter } from 'rxjs';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, MobileNavigationComponent, ToastComponent],
  template: `
    @if (!isAdminRoute()) {
      <app-header />
    }
    <main class="page-shell" [class.admin-remote-shell]="isAdminRoute()">
      <router-outlet />
    </main>
    @if (!isAdminRoute()) {
      <app-footer />
      <app-mobile-navigation />
    }
    <app-toast />
  `,
})
export class ShellComponent implements OnInit {
  private readonly auth = inject(AuthFacade);
  private readonly cart = inject(CartFacade);
  private readonly wishlist = inject(WishlistFacade);
  private readonly router = inject(Router);

  private readonly currentUrl = signal(this.router.url);
  readonly isAdminRoute = computed(() => this.currentUrl().startsWith('/admin'));

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.currentUrl.set(event.urlAfterRedirects));
  }

  async ngOnInit(): Promise<void> {
    if (this.auth.isAuthenticated()) {
      await Promise.all([this.auth.loadCurrentUser(), this.cart.load(), this.wishlist.load()]);
    }
  }
}
