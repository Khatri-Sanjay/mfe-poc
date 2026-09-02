import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { loadRemote } from '../../../../federation-loader';

type ProductManagerRegisterModule = {
  PRODUCT_MANAGER_ELEMENT: string;
};

@Component({
  selector: 'app-product-manager-remote',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<div #outlet class="product-manager-remote-outlet"></div>`,
  styles: `
    :host {
      display: block;
      min-height: calc(100dvh - 4.5rem);
    }

    .product-manager-remote-outlet {
      min-height: inherit;
    }
  `,
})
export class ProductManagerRemoteComponent implements OnInit, OnDestroy {
  @ViewChild('outlet', { static: true })
  private readonly outlet!: ElementRef<HTMLElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private remoteElement?: HTMLElement;
  private readonly routerEvents = this.router.events
    .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    .subscribe(() => this.syncRemotePath());

  async ngOnInit(): Promise<void> {
    const remote = await loadRemote<ProductManagerRegisterModule>('productManager', './register');
    this.remoteElement = document.createElement(remote.PRODUCT_MANAGER_ELEMENT);
    this.remoteElement.setAttribute('api-base-url', this.apiOrigin());
    this.remoteElement.setAttribute('refresh-endpoint', '/api/v1/auth/refresh');
    this.remoteElement.setAttribute('refresh-token-field', 'refreshToken');
    this.remoteElement.setAttribute('login-url', this.loginUrl());
    this.remoteElement.setAttribute('redirect-on-missing-auth', 'true');
    this.remoteElement.setAttribute('initial-path', this.remotePath());
    this.outlet.nativeElement.replaceChildren(this.remoteElement);
  }

  ngOnDestroy(): void {
    this.routerEvents.unsubscribe();
    this.remoteElement?.remove();
  }

  private syncRemotePath(): void {
    if (!this.remoteElement) return;
    this.remoteElement.setAttribute('initial-path', this.remotePath());
  }

  private remotePath(): string {
    const url = this.router.url.split('?')[0];
    const query = this.router.url.includes('?') ? `?${this.router.url.split('?')[1]}` : '';
    const adminPrefix = this.route.snapshot.pathFromRoot.some((route) => route.routeConfig?.path === 'admin')
      ? '/admin'
      : '';
    const relative = url.startsWith(`${adminPrefix}/products`)
      ? url.slice(adminPrefix.length)
      : '/products';

    return `${relative}${query}`;
  }

  private apiOrigin(): string {
    return environment.apiUrl.replace(/\/api\/v1\/?$/, '');
  }

  private loginUrl(): string {
    return window.location.pathname.startsWith('/admin') ? '/admin/auth/login' : '/auth/login';
  }
}
