import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Product } from '../../core/models/commerce.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../features/cart/cart.facade';
import { WishlistFacade } from '../../features/wishlist/wishlist.facade';
import { CatalogFacade } from './catalog.facade';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe, EmptyStateComponent],
  template: `
    <section class="catalog-page">
      <aside class="filter-panel">
        <div class="section-heading compact">
          <h1>Products</h1>
          <button class="icon-btn" type="button" aria-label="Refresh products" (click)="applyFilters()"><i class="bi bi-arrow-repeat"></i></button>
        </div>
        <form [formGroup]="filters" (ngSubmit)="applyFilters()">
          <label>Search <input formControlName="search" placeholder="Search product, SKU, brand" /></label>
          <label>
            Category
            <select formControlName="category">
              <option value="">All categories</option>
              @for (category of catalog.categories(); track category.id) {
                <option [value]="category.slug">{{ category.name }}</option>
              }
            </select>
          </label>
          <label>
            Brand
            <select formControlName="brand">
              <option value="">All brands</option>
              @for (brand of catalog.brands(); track brand.id) {
                <option [value]="brand.slug">{{ brand.name }}</option>
              }
            </select>
          </label>
          <div class="form-grid">
            <label>Min <input type="number" min="0" formControlName="minPrice" /></label>
            <label>Max <input type="number" min="0" formControlName="maxPrice" /></label>
          </div>
          <label>Sort
            <select formControlName="sortBy">
              <option value="createdAt">Newest</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
            </select>
          </label>
          <div class="segmented">
            <button [class.active]="filters.controls.sortOrder.value === 'desc'" type="button" (click)="setSortOrder('desc')">Desc</button>
            <button [class.active]="filters.controls.sortOrder.value === 'asc'" type="button" (click)="setSortOrder('asc')">Asc</button>
          </div>
          <label class="check-row"><input type="checkbox" formControlName="inStock" /> In stock only</label>
          <button class="btn-primary w-full" type="submit">Apply filters</button>
        </form>
      </aside>

      <div class="catalog-results">
        @if (catalog.loading()) {
          <div class="skeleton-grid">
            @for (item of [1,2,3,4,5,6]; track item) { <span></span> }
          </div>
        } @else if (catalog.products().length === 0) {
          <app-empty-state title="No products found" message="Try changing your search or filters.">
            <button class="btn-secondary mt-3" type="button" (click)="resetFilters()">Reset filters</button>
          </app-empty-state>
        } @else {
          <div class="product-grid">
            @for (product of catalog.products(); track product.id) {
              <article class="product-card">
                <a [routerLink]="['/products', product.slug]" class="product-image-link">
                  <img [src]="image(product)" [alt]="product.name" loading="lazy" (error)="useFallbackImage($event)" />
                </a>
                <div class="product-content">
                  <small>{{ product.brand?.name || 'Independent' }}</small>
                  <a [routerLink]="['/products', product.slug]"><h2>{{ product.name }}</h2></a>
                  <p>{{ product.shortDescription || product.description || 'Catalog product' }}</p>
                  <div class="product-row">
                    <strong>{{ price(product) | money:currency(product) }}</strong>
                    <span class="rating"><i class="bi bi-star-fill"></i>{{ product.averageRating || 0 }} ({{ product.reviewCount }})</span>
                  </div>
                  <div class="product-row">
                    <span [class]="stock(product) > 0 ? 'stock in' : 'stock out'">{{ stock(product) > 0 ? stock(product) + ' available' : 'Out of stock' }}</span>
                    <div class="inline-actions">
                      <button class="icon-btn" type="button" aria-label="Add to wishlist" (click)="addWishlist(product)">
                        <i [class]="wishlist.has(product.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
                      </button>
                      <button class="btn-primary compact" type="button" [disabled]="stock(product) === 0" (click)="addToCart(product)">
                        <i class="bi bi-cart-plus"></i> Add
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            }
          </div>
          @if (catalog.meta(); as meta) {
            <div class="pagination-row">
              <button class="btn-secondary compact" type="button" [disabled]="meta.page <= 1" (click)="changePage(meta.page - 1)">
                <i class="bi bi-chevron-left"></i> Prev
              </button>
              <span class="pagination-info">Page {{ meta.page }} of {{ meta.totalPages }} ({{ meta.total }} items)</span>
              <button class="btn-secondary compact" type="button" [disabled]="meta.page >= meta.totalPages" (click)="changePage(meta.page + 1)">
                Next <i class="bi bi-chevron-right"></i>
              </button>
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class ProductListPage implements OnInit, OnDestroy {
  private readonly fallbackProductImage =
    'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="900" height="650" viewBox="0 0 900 650"%3E%3Crect width="900" height="650" fill="%23edf4f1"/%3E%3Cg fill="%2312473f" font-family="Arial,sans-serif" text-anchor="middle"%3E%3Ctext x="450" y="315" font-size="34" font-weight="700"%3EProduct image%3C/text%3E%3Ctext x="450" y="358" font-size="20" fill="%236b7b86"%3ENot available%3C/text%3E%3C/g%3E%3C/svg%3E';
  readonly catalog = inject(CatalogFacade);
  readonly cart = inject(CartFacade);
  readonly wishlist = inject(WishlistFacade);
  private readonly auth = inject(AuthFacade);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  readonly filters = new FormGroup({
    search: new FormControl('', { nonNullable: true }),
    category: new FormControl('', { nonNullable: true }),
    brand: new FormControl('', { nonNullable: true }),
    minPrice: new FormControl('', { nonNullable: true }),
    maxPrice: new FormControl('', { nonNullable: true }),
    inStock: new FormControl(true, { nonNullable: true }),
    sortBy: new FormControl<'createdAt' | 'name' | 'price'>('createdAt', { nonNullable: true }),
    sortOrder: new FormControl<'asc' | 'desc'>('desc', { nonNullable: true }),
  });

  async ngOnInit(): Promise<void> {
    this.filters.patchValue({
      search: this.route.snapshot.queryParamMap.get('search') ?? '',
      category: this.route.snapshot.queryParamMap.get('category') ?? '',
      brand: this.route.snapshot.queryParamMap.get('brand') ?? '',
      minPrice: this.route.snapshot.queryParamMap.get('minPrice') ?? '',
      maxPrice: this.route.snapshot.queryParamMap.get('maxPrice') ?? '',
      inStock: this.route.snapshot.queryParamMap.get('inStock') !== 'false',
      sortBy: (this.route.snapshot.queryParamMap.get('sortBy') as 'createdAt' | 'name' | 'price') ?? 'createdAt',
      sortOrder: (this.route.snapshot.queryParamMap.get('sortOrder') as 'asc' | 'desc') ?? 'desc',
    });
    if (this.auth.isAuthenticated()) await this.wishlist.load();
    await this.catalog.init();
    await this.applyFilters(false);
    this.filters.controls.search.valueChanges.subscribe(() => {
      if (this.searchTimer) clearTimeout(this.searchTimer);
      this.searchTimer = setTimeout(() => void this.applyFilters(), 300);
    });
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
  }

  async applyFilters(updateUrl = true): Promise<void> {
    const value = this.filters.getRawValue();
    const query = {
      page: 1,
      search: value.search,
      category: value.category,
      brand: value.brand,
      minPrice: value.minPrice ? Number(value.minPrice) : undefined,
      maxPrice: value.maxPrice ? Number(value.maxPrice) : undefined,
      inStock: value.inStock,
      sortBy: value.sortBy,
      sortOrder: value.sortOrder,
    };
    if (updateUrl) await this.router.navigate([], { relativeTo: this.route, queryParams: query, queryParamsHandling: 'merge' });
    await this.catalog.search(query);
  }

  async changePage(page: number): Promise<void> {
    await this.catalog.search({ page });
  }

  async resetFilters(): Promise<void> {
    this.filters.reset({ search: '', category: '', brand: '', minPrice: '', maxPrice: '', inStock: true, sortBy: 'createdAt', sortOrder: 'desc' });
    await this.applyFilters();
  }

  setSortOrder(sortOrder: 'asc' | 'desc'): void {
    this.filters.controls.sortOrder.setValue(sortOrder);
    void this.applyFilters();
  }

  async addWishlist(product: Product): Promise<void> {
    if (!(await this.auth.requireAuthentication(this.router.url))) return;
    await this.wishlist.add(product.id);
  }

  async addToCart(product: Product): Promise<void> {
    if (!(await this.auth.requireAuthentication(this.router.url))) return;
    const variant = product.variants.find((v) => v.isActive && v.quantityAvailable > 0) ?? product.variants[0];
    if (variant) {
      await this.cart.addProduct(variant.id);
    }
  }

  image(product: Product): string {
    return product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? this.fallbackProductImage;
  }

  useFallbackImage(event: Event): void {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.dataset['fallbackApplied'] !== 'true') {
      image.dataset['fallbackApplied'] = 'true';
      image.src = this.fallbackProductImage;
    }
  }

  price(product: Product): string {
    return product.variants[0]?.price ?? '0.00';
  }

  currency(product: Product): string {
    return product.variants[0]?.currency ?? 'AUD';
  }

  stock(product: Product): number {
    return product.variants.reduce((sum, variant) => sum + variant.quantityAvailable, 0);
  }
}
