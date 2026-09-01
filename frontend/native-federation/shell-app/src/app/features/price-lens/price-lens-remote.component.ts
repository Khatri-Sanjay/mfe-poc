import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../environments/environment';
import { loadRemote } from '../../../federation-loader';

type PriceLensRemoteModule = {
  mount: (
    element: HTMLElement,
    options?: { apiBaseUrl?: string; productId?: string },
  ) => { unmount: () => void };
};

@Component({
  selector: 'app-price-lens-remote',
  standalone: true,
  template: `
    <section class="price-lens-shell">
      <div #outlet class="price-lens-shell__outlet"></div>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .price-lens-shell {
        min-height: calc(100dvh - 12rem);
      }

      .price-lens-shell__outlet {
        min-height: 100%;
      }
    `,
  ],
})
export class PriceLensRemoteComponent implements AfterViewInit, OnDestroy {
  @ViewChild('outlet', { static: true })
  private readonly outlet!: ElementRef<HTMLElement>;

  private readonly route = inject(ActivatedRoute);
  private remoteRoot?: { unmount: () => void };

  async ngAfterViewInit(): Promise<void> {
    const remote = await loadRemote<PriceLensRemoteModule>('price_lens_product_app', './mount');
    const productId = this.route.snapshot.paramMap.get('productId') ?? undefined;

    this.remoteRoot = remote.mount(this.outlet.nativeElement, {
      apiBaseUrl: environment.apiBaseUrl,
      productId,
    });
  }

  ngOnDestroy(): void {
    this.remoteRoot?.unmount();
  }
}
