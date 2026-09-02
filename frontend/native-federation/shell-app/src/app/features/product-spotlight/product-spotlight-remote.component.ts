import { CUSTOM_ELEMENTS_SCHEMA, Component, ElementRef, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { loadRemoteFromEntry } from '../../../federation-loader';

type ProductSpotlightRegisterModule = {
  registerProductSpotlightElement: (tagName?: string) => void;
};

type ProductSpotlightSelectEvent = CustomEvent<{
  slug: string;
  name: string;
  id: string;
}>;

@Component({
  selector: 'app-product-spotlight-remote',
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `
    @if (status === 'loading') {
      <section class="remote-placeholder" aria-live="polite" aria-busy="true">
        <span class="skeleton-line w40"></span>
        <span class="skeleton-line w80"></span>
        <span class="skeleton-line w100"></span>
      </section>
    }

    @if (status === 'error') {
      <section class="remote-placeholder" role="status">
        <p class="eyebrow">Product spotlight</p>
        <h2>Featured products are unavailable</h2>
        <p>The React remote could not be loaded. The rest of the storefront can continue running.</p>
      </section>
    }

    <div [hidden]="status !== 'ready'">
      <product-spotlight-widget
        #widget
        [attr.api-base-url]="apiBaseUrl"
        heading="Product deals from a React remote"
        product-url-prefix="/products"
      ></product-spotlight-widget>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    .remote-placeholder {
      display: grid;
      gap: 0.75rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface);
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
    }

    .remote-placeholder h2,
    .remote-placeholder p {
      margin: 0;
    }

    .remote-placeholder p:not(.eyebrow) {
      color: var(--color-text-secondary);
    }

    .remote-placeholder .btn-primary {
      width: max-content;
    }

    .skeleton-line {
      display: block;
      height: 1rem;
      border-radius: var(--radius-sm);
      background: linear-gradient(90deg, var(--color-skeleton-start), var(--color-skeleton-mid), var(--color-skeleton-start));
      background-size: 200% 100%;
      animation: skeleton 1.3s infinite;
    }

    .skeleton-line.w40 {
      width: 40%;
    }

    .skeleton-line.w80 {
      width: 80%;
    }

    .skeleton-line.w100 {
      width: 100%;
      height: 11rem;
    }

    @keyframes skeleton {
      to {
        background-position: -200% 0;
      }
    }
  `,
})
export class ProductSpotlightRemoteComponent implements OnInit, OnDestroy {
  @ViewChild('widget') private widget?: ElementRef<HTMLElement>;

  readonly apiBaseUrl = environment.apiBaseUrl;
  private readonly remoteEntryUrl = environment.productSpotlightRemoteEntry;
  status: 'loading' | 'ready' | 'error' = 'loading';

  private readonly router = inject(Router);
  private removeSelectListener?: () => void;
  private removeViewAllListener?: () => void;

  async ngOnInit(): Promise<void> {
    try {
      const remote = await loadRemoteFromEntry<ProductSpotlightRegisterModule>(
        this.remoteEntryUrl,
        'product_spotlight_app',
        './register',
      );
      remote.registerProductSpotlightElement();
      this.status = 'ready';
      setTimeout(() => this.listenToWidget());
    } catch (error) {
      console.error('Failed to load product_spotlight_app:./register', error);
      this.status = 'error';
    }
  }

  ngOnDestroy(): void {
    this.removeSelectListener?.();
    this.removeViewAllListener?.();
  }

  private listenToWidget(): void {
    const element = this.widget?.nativeElement;
    if (!element) return;

    const handleSelect = (event: Event) => {
      const detail = (event as ProductSpotlightSelectEvent).detail;
      if (detail?.slug) {
        void this.router.navigate(['/products', detail.slug]);
      }
    };

    const handleViewAll = () => {
      void this.router.navigate(['/products']);
    };

    element.addEventListener('product-spotlight-select', handleSelect);
    element.addEventListener('product-spotlight-view-all', handleViewAll);

    this.removeSelectListener = () => element.removeEventListener('product-spotlight-select', handleSelect);
    this.removeViewAllListener = () => element.removeEventListener('product-spotlight-view-all', handleViewAll);
  }
}
