import {
  ChangeDetectorRef,
  CUSTOM_ELEMENTS_SCHEMA,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
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
    <div class="product-spotlight-container">
      @if (status() === 'loading') {
        <section class="remote-placeholder" aria-live="polite" aria-busy="true">
          <span class="skeleton-line w40"></span>
          <span class="skeleton-line w80"></span>
          <span class="skeleton-line w100"></span>
        </section>

      } @else if (status() === 'error') {
        <section class="remote-placeholder" role="alert">
          <p class="eyebrow">Product spotlight</p>

          <h2>Featured products are unavailable</h2>

          <p>
            The product spotlight could not be loaded. The rest of the storefront can continue
            running.
          </p>

          <button type="button" class="btn-primary" (click)="retry()">Try again</button>
        </section>

      } @else {
        <product-spotlight-widget
          #widget
          [attr.api-base-url]="apiBaseUrl"
          heading="Product deals from a React remote"
          product-url-prefix="/products"
        ></product-spotlight-widget>
      }
    </div>
  `,

  styles: `
    :host {
      display: block;
    }

    .product-spotlight-container {
      width: 100%;
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

    .eyebrow {
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--color-text-secondary);
    }

    .btn-primary {
      width: max-content;

      padding: 0.6rem 1rem;

      border: 0;
      border-radius: var(--radius-sm);

      background: var(--color-primary);
      color: white;

      cursor: pointer;
    }

    .btn-primary:hover {
      opacity: 0.9;
    }

    .skeleton-line {
      display: block;

      height: 1rem;

      border-radius: var(--radius-sm);

      background: linear-gradient(
        90deg,
        var(--color-skeleton-start),
        var(--color-skeleton-mid),
        var(--color-skeleton-start)
      );

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
  @ViewChild('widget')
  private widget?: ElementRef<HTMLElement>;

  readonly apiBaseUrl = environment.apiBaseUrl;

  private readonly remoteEntryUrl = environment.productSpotlightRemoteEntry;

  private readonly router = inject(Router);

  private readonly zone = inject(NgZone);

  private readonly cdr = inject(ChangeDetectorRef);

  status = signal<'loading' | 'ready' | 'error'>('loading');

  private removeSelectListener?: () => void;

  private removeViewAllListener?: () => void;

  async ngOnInit(): Promise<void> {
    console.log('[ProductSpotlightRemote] ngOnInit started');

    await this.loadRemote();
  }

  ngOnDestroy(): void {
    console.log('[ProductSpotlightRemote] ngOnDestroy');

    this.removeEventListeners();
  }

  /**
   * Load the React remote and register
   * the <product-spotlight-widget> custom element.
   */
  private async loadRemote(): Promise<void> {
    this.setStatus('loading');

    console.log('[ProductSpotlightRemote] Loading remote:', this.remoteEntryUrl);

    try {
      const remote = await loadRemoteFromEntry<ProductSpotlightRegisterModule>(
        this.remoteEntryUrl,
        'product_spotlight_app',
        './register',
      );

      console.log('[ProductSpotlightRemote] Remote loaded:', remote);

      if (!remote || typeof remote.registerProductSpotlightElement !== 'function') {
        throw new Error('Remote does not expose registerProductSpotlightElement()');
      }

      console.log('[ProductSpotlightRemote] Registering product spotlight element');

      remote.registerProductSpotlightElement();

      /*
       * IMPORTANT:
       *
       * The remote loader may resolve outside Angular's
       * change-detection context.
       *
       * Therefore explicitly enter Angular's zone and
       * update the signal.
       */
      this.zone.run(() => {
        this.status.set('ready');

        /*
         * Force Angular to update the DOM immediately.
         */
        this.cdr.detectChanges();
      });

      console.log('[ProductSpotlightRemote] Status:', this.status());

      /*
       * The widget is conditionally rendered only after
       * status becomes "ready", so wait until Angular has
       * rendered it before accessing @ViewChild.
       */
      setTimeout(() => {
        console.log('[ProductSpotlightRemote] Attaching widget listeners');

        this.listenToWidget();
      });
    } catch (error) {
      console.error(
        '[ProductSpotlightRemote] Failed to load product_spotlight_app:./register',
        error,
      );

      this.zone.run(() => {
        this.status.set('error');

        this.cdr.detectChanges();
      });

      console.log('[ProductSpotlightRemote] Status:', this.status());
    }
  }

  /**
   * Update the status while making sure Angular
   * knows that the view needs to be updated.
   */
  private setStatus(status: 'loading' | 'ready' | 'error'): void {
    this.zone.run(() => {
      this.status.set(status);

      this.cdr.detectChanges();
    });
  }

  /**
   * Retry loading the remote.
   */
  async retry(): Promise<void> {
    console.log('[ProductSpotlightRemote] Retrying remote load...');

    this.removeEventListeners();

    await this.loadRemote();
  }

  /**
   * Attach event listeners to the React custom element.
   */
  private listenToWidget(): void {
    const element = this.widget?.nativeElement;

    if (!element) {
      console.warn('[ProductSpotlightRemote] Widget element not found');

      return;
    }

    console.log('[ProductSpotlightRemote] Widget found:', element);

    const handleSelect = (event: Event): void => {
      const customEvent = event as ProductSpotlightSelectEvent;

      const detail = customEvent.detail;

      console.log('[ProductSpotlightRemote] Product selected:', detail);

      if (!detail?.slug) {
        return;
      }

      void this.router.navigate(['/products', detail.slug]);
    };

    const handleViewAll = (): void => {
      console.log('[ProductSpotlightRemote] View all clicked');

      void this.router.navigate(['/products']);
    };

    element.addEventListener('product-spotlight-select', handleSelect);

    element.addEventListener('product-spotlight-view-all', handleViewAll);

    this.removeSelectListener = () => {
      element.removeEventListener('product-spotlight-select', handleSelect);
    };

    this.removeViewAllListener = () => {
      element.removeEventListener('product-spotlight-view-all', handleViewAll);
    };
  }

  /**
   * Remove all widget event listeners.
   */
  private removeEventListeners(): void {
    this.removeSelectListener?.();

    this.removeViewAllListener?.();

    this.removeSelectListener = undefined;

    this.removeViewAllListener = undefined;
  }
}
