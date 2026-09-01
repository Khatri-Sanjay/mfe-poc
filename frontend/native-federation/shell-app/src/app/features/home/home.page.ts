import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CatalogFacade } from '../catalog/catalog.facade';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { Product } from '../../core/models/commerce.models';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, MoneyPipe],
  template: `
    <section class="home-hero">
      <div>
        <p class="eyebrow">Production storefront</p>
        <h1>Commerce experience backed by the NestJS API.</h1>
        <p>Browse catalog data, authenticate, manage cart, checkout, and operate admin workflows through clear domain boundaries.</p>
        <div class="hero-actions">
          <a class="btn-primary" routerLink="/products">Shop products</a>
        </div>
      </div>
      <div class="hero-panel">
        <span><strong>{{ catalog.products().length }}</strong> products loaded</span>
        <span><strong>{{ catalog.categories().length }}</strong> categories</span>
        <span><strong>{{ catalog.brands().length }}</strong> brands</span>
      </div>
    </section>

    <section class="content-section">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Featured</p>
          <h2>Current catalog</h2>
        </div>
        <a routerLink="/products">View all</a>
      </div>
      <div class="product-grid compact-grid">
        @for (product of catalog.featured(); track product.id) {
          <a class="product-card" [routerLink]="['/products', product.slug]">
            <img [src]="image(product)" [alt]="product.name" />
            <div>
              <small>{{ product.brand?.name || 'Independent' }}</small>
              <strong>{{ product.name }}</strong>
              <span>{{ price(product) | money:currency(product) }}</span>
            </div>
          </a>
        }
      </div>
    </section>
  `,
})
export class HomePage implements OnInit {
  readonly catalog = inject(CatalogFacade);

  async ngOnInit(): Promise<void> {
    if (this.catalog.products().length === 0) await this.catalog.init();
  }

  image(product: Product): string {
    return product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? 'https://placehold.co/900x700/f4f7f6/19302d?text=Product';
  }

  price(product: Product): string {
    return product.variants[0]?.price ?? '0.00';
  }

  currency(product: Product): string {
    return product.variants[0]?.currency ?? 'AUD';
  }
}
