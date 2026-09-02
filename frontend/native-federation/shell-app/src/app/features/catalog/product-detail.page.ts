import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductVariant, Review } from '../../core/models/commerce.models';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../features/cart/cart.facade';
import { WishlistFacade } from '../../features/wishlist/wishlist.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { CatalogService } from './catalog.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe, EmptyStateComponent],
  template: `
    @if (product(); as item) {
      <nav class="detail-breadcrumb" aria-label="Breadcrumb">
        <a routerLink="/">Home</a>
        <i class="bi bi-chevron-right"></i>
        <a routerLink="/products">Products</a>
        <i class="bi bi-chevron-right"></i>
        <span>{{ item.name }}</span>
      </nav>

      <section class="detail-layout">
        <div class="detail-gallery">
          <div class="gallery-main">
            <img [src]="mainImage()" [alt]="item.name" (error)="useFallbackImage($event)" />
            @if (selectedVariant()?.compareAtPrice) {
              <span class="gallery-badge">Sale</span>
            }
          </div>
          @if (item.images.length > 1) {
            <div class="gallery-thumbs">
              @for (image of item.images; track image.id) {
                <button
                  type="button"
                  class="thumb-btn"
                  [class.active]="selectedImage() === image.url"
                  (click)="selectedImage.set(image.url)"
                >
                  <img [src]="image.url" [alt]="image.altText || item.name" />
                </button>
              }
            </div>
          }
        </div>

        <article class="detail-info">
          <div class="detail-info-top">
            @if (item.brand) {
              <a class="detail-brand" [routerLink]="['/brands', item.brand.slug]">{{ item.brand.name }}</a>
            }
            <h1 class="detail-title">{{ item.name }}</h1>

            <div class="detail-rating-row">
              <div class="detail-stars">
                @for (star of [1,2,3,4,5]; track star) {
                  <i class="bi" [class.bi-star-fill]="star <= item.averageRating" [class.bi-star]="star > item.averageRating"></i>
                }
              </div>
              <span class="detail-rating-text">{{ item.averageRating || 0 }} ({{ item.reviewCount }} review{{ item.reviewCount !== 1 ? 's' : '' }})</span>
            </div>

            <div class="detail-price-block">
              <span class="detail-price">{{ selectedVariant()?.price | money:selectedVariant()?.currency }}</span>
              @if (selectedVariant()?.compareAtPrice) {
                <span class="detail-compare-price">{{ selectedVariant()?.compareAtPrice | money:selectedVariant()?.currency }}</span>
                <span class="detail-discount">
                  -{{ discountPercent(selectedVariant()!) }}%
                </span>
              }
            </div>

            <p class="detail-description">{{ item.shortDescription || item.description || '' }}</p>
          </div>

          <div class="detail-info-mid">
            @if (item.variants.length > 1) {
              <div class="detail-section">
                <label class="detail-label">Variant</label>
                <div class="variant-chips">
                  @for (variant of item.variants; track variant.id) {
                    <button
                      type="button"
                      class="variant-chip"
                      [class.active]="variantControl.value === variant.id"
                      [disabled]="variant.quantityAvailable === 0"
                      (click)="variantControl.setValue(variant.id)"
                    >
                      <span class="variant-chip-name">{{ variant.name }}</span>
                      @if (Object.keys(variant.options).length > 0) {
                        <span class="variant-chip-options">
                          @for (entry of objectEntries(variant.options); track entry[0]) {
                            {{ entry[1] }}{{ !$last ? ' / ' : '' }}
                          }
                        </span>
                      }
                    </button>
                  }
                </div>
              </div>
            } @else if (item.variants.length === 1 && Object.keys(item.variants[0].options).length > 0) {
              <div class="detail-section">
                <label class="detail-label">Options</label>
                <div class="tag-list">
                  @for (entry of objectEntries(item.variants[0].options); track entry[0]) {
                    <span>{{ entry[0] }}: {{ entry[1] }}</span>
                  }
                </div>
              </div>
            }

            <div class="detail-section">
              <label class="detail-label">Quantity</label>
              <div class="qty-selector">
                <button type="button" class="qty-btn" (click)="decrementQty()" [disabled]="quantityControl.value <= 1">
                  <i class="bi bi-dash"></i>
                </button>
                <input type="number" [formControl]="quantityControl" min="1" class="qty-input" />
                <button type="button" class="qty-btn" (click)="incrementQty()">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>

            <div class="detail-stock">
              @if (stockAvailable() > 0) {
                <span class="stock in"><i class="bi bi-check-circle-fill"></i> In stock</span>
                <span class="stock-qty">{{ stockAvailable() }} available</span>
              } @else {
                <span class="stock out"><i class="bi bi-x-circle-fill"></i> Out of stock</span>
              }
            </div>

            <div class="detail-actions">
              <button
                class="btn-primary detail-add-btn"
                type="button"
                [disabled]="!selectedVariant() || stockAvailable() === 0"
                (click)="addToCart(item)"
              >
                <i class="bi bi-cart-plus"></i>
                Add to cart
              </button>
              <button
                class="btn-secondary detail-wishlist-btn"
                type="button"
                [class.wishlisted]="wishlist.has(item.id)"
                (click)="addWishlist(item)"
                [attr.aria-label]="wishlist.has(item.id) ? 'Remove from wishlist' : 'Add to wishlist'"
              >
                <i [class]="wishlist.has(item.id) ? 'bi bi-heart-fill' : 'bi bi-heart'"></i>
              </button>
              <a class="btn-secondary detail-price-lens-btn" [routerLink]="['/price-lens', 'search', priceLensQuery(item)]">
                <i class="bi bi-bar-chart-line"></i>
                Price Lens
              </a>
            </div>
          </div>

          <div class="detail-info-bottom">
            @if (item.categories.length > 0) {
              <div class="detail-meta-row">
                <span class="detail-meta-label">Categories</span>
                <div class="tag-list">
                  @for (category of item.categories; track category.id) {
                    <a [routerLink]="['/categories', category.slug]" class="tag-link">{{ category.name }}</a>
                  }
                </div>
              </div>
            }
            <div class="detail-meta-row">
              <span class="detail-meta-label">SKU</span>
              <span>{{ selectedVariant()?.sku || 'N/A' }}</span>
            </div>
          </div>
        </article>
      </section>

      <section class="detail-tabs-section">
        <div class="tabs-header">
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'description'"
            (click)="activeTab.set('description')"
          >Description</button>
          <button
            type="button"
            class="tab-btn"
            [class.active]="activeTab() === 'reviews'"
            (click)="activeTab.set('reviews')"
          >Reviews ({{ item.reviewCount }})</button>
        </div>

        @if (activeTab() === 'description') {
          <div class="tab-content">
            <div class="description-content">
              {{ item.description || item.shortDescription || 'No description available for this product.' }}
            </div>
          </div>
        }

        @if (activeTab() === 'reviews') {
          <div class="tab-content">
            @if (reviews().length > 0) {
              <div class="reviews-summary">
                <div class="reviews-avg">
                  <span class="reviews-avg-num">{{ item.averageRating || 0 }}</span>
                  <div class="detail-stars">
                    @for (star of [1,2,3,4,5]; track star) {
                      <i class="bi" [class.bi-star-fill]="star <= item.averageRating" [class.bi-star]="star > item.averageRating"></i>
                    }
                  </div>
                  <span class="reviews-avg-count">{{ item.reviewCount }} review{{ item.reviewCount !== 1 ? 's' : '' }}</span>
                </div>
              </div>
              <div class="reviews-list">
                @for (review of reviews(); track review.id) {
                  <article class="review-card">
                    <div class="review-header">
                      <div>
                        <strong class="review-title">{{ review.title }}</strong>
                        <div class="review-stars">
                          @for (star of [1,2,3,4,5]; track star) {
                            <i class="bi" [class.bi-star-fill]="star <= review.rating" [class.bi-star]="star > review.rating"></i>
                          }
                        </div>
                      </div>
                      @if (review.verifiedPurchase) {
                        <span class="review-badge"><i class="bi bi-patch-check-fill"></i> Verified</span>
                      }
                    </div>
                    <p class="review-body">{{ review.comment || 'No comment provided.' }}</p>
                    @if (canManageReview(review)) {
                      <div class="review-actions">
                        <button class="link-button compact" type="button" (click)="startEditReview(review)">Edit</button>
                        <button class="link-button compact danger-text" type="button" (click)="deleteReview(review)">Delete</button>
                      </div>
                    }
                  </article>
                }
              </div>
            } @else {
              <div class="reviews-empty">
                <i class="bi bi-chat-square-text"></i>
                <p>No reviews yet. Be the first to review this product.</p>
              </div>
            }

            @if (auth.isAuthenticated()) {
              <form class="review-form" [formGroup]="reviewForm" (ngSubmit)="submitReview(item)">
                <h3 class="review-form-title">{{ editingReviewId() ? 'Edit your review' : 'Write a review' }}</h3>
                <label>
                  Rating
                  <div class="rating-input">
                    @for (star of [1,2,3,4,5]; track star) {
                      <button
                        type="button"
                        class="rating-star"
                        [class.active]="star <= reviewForm.controls.rating.value"
                        (click)="reviewForm.controls.rating.setValue(star)"
                      >
                        <i class="bi" [class.bi-star-fill]="star <= reviewForm.controls.rating.value" [class.bi-star]="star > reviewForm.controls.rating.value"></i>
                      </button>
                    }
                  </div>
                </label>
                <input formControlName="title" placeholder="Review title" />
                <textarea formControlName="comment" placeholder="Share your experience with this product..."></textarea>
                <div class="review-form-actions">
                  <button class="btn-primary compact" type="submit" [disabled]="reviewForm.invalid">
                    {{ editingReviewId() ? 'Update review' : 'Submit review' }}
                  </button>
                  @if (editingReviewId()) {
                    <button class="btn-secondary compact" type="button" (click)="cancelEditReview()">Cancel</button>
                  }
                </div>
              </form>
            } @else {
              <div class="review-login-prompt">
                <a class="btn-secondary" routerLink="/auth/login">Sign in to write a review</a>
              </div>
            }
          </div>
        }
      </section>
    } @else if (loading()) {
      <div class="detail-skeleton">
        <div class="skeleton-gallery">
          <span class="skeleton-main"></span>
          <div class="skeleton-thumbs">
            <span></span><span></span><span></span>
          </div>
        </div>
        <div class="skeleton-info">
          <span class="skeleton-line w40"></span>
          <span class="skeleton-line w80"></span>
          <span class="skeleton-line w30"></span>
          <span class="skeleton-line w60"></span>
          <span class="skeleton-line w100"></span>
          <span class="skeleton-line w100"></span>
          <span class="skeleton-line w70"></span>
        </div>
      </div>
    } @else {
      <app-empty-state title="Product not found" message="The product you are looking for does not exist or has been removed.">
        <a class="btn-secondary" routerLink="/products">Back to shop</a>
      </app-empty-state>
    }
  `,
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CatalogService);
  private readonly cart = inject(CartFacade);
  readonly auth = inject(AuthFacade);
  readonly wishlist = inject(WishlistFacade);
  private readonly notifications = inject(NotificationService);

  readonly product = signal<Product | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly loading = signal(true);
  readonly selectedImage = signal('');
  readonly activeTab = signal<'description' | 'reviews'>('description');
  readonly editingReviewId = signal('');

  readonly variantControl = new FormControl('', { nonNullable: true });
  readonly quantityControl = new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] });
  readonly reviewForm = new FormGroup({
    rating: new FormControl(5, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    comment: new FormControl('', { nonNullable: true }),
  });

  readonly Object = Object;

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    try {
      const product = await this.service.productBySlug(slug);
      this.product.set(product);
      this.variantControl.setValue(product.variants[0]?.id ?? '');
      this.selectedImage.set(product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? '');
      const reviewsResult = await this.service.reviews(product.id);
      this.reviews.set(reviewsResult.items);
    } catch {
      this.product.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  mainImage(): string {
    return this.selectedImage() || 'https://placehold.co/1000x850/f4f7f6/19302d?text=Product';
  }

  selectedVariant(): ProductVariant | null {
    return this.product()?.variants.find((variant) => variant.id === this.variantControl.value) ?? null;
  }

  stockAvailable(): number {
    const variant = this.selectedVariant();
    if (!variant) return 0;
    return variant.quantityAvailable;
  }

  discountPercent(variant: ProductVariant): number {
    const price = Number(variant.price);
    const compare = Number(variant.compareAtPrice);
    if (!compare || compare <= price) return 0;
    return Math.round(((compare - price) / compare) * 100);
  }

  incrementQty(): void {
    const current = this.quantityControl.value ?? 1;
    this.quantityControl.setValue(current + 1);
  }

  decrementQty(): void {
    const current = this.quantityControl.value ?? 1;
    if (current > 1) this.quantityControl.setValue(current - 1);
  }

  objectEntries(obj: Record<string, string>): [string, string][] {
    return Object.entries(obj);
  }

  priceLensQuery(product: Product): string {
    const variant = this.selectedVariant();
    return [product.brand?.name, product.name, variant?.name].filter(Boolean).join(' ');
  }

  useFallbackImage(event: Event): void {
    const image = event.target;
    if (image instanceof HTMLImageElement && image.dataset['fallbackApplied'] !== 'true') {
      image.dataset['fallbackApplied'] = 'true';
      image.src = 'https://placehold.co/1000x850/f4f7f6/19302d?text=Product';
    }
  }

  async addToCart(product: Product): Promise<void> {
    if (!(await this.auth.requireAuthentication(this.currentProductUrl()))) return;
    const variant = this.selectedVariant();
    if (!variant) return;
    await this.cart.addProduct(variant.id, this.quantityControl.value);
  }

  async addWishlist(product: Product): Promise<void> {
    if (!(await this.auth.requireAuthentication(this.currentProductUrl()))) return;
    if (this.wishlist.has(product.id)) {
      await this.wishlist.remove(product.id);
    } else {
      await this.wishlist.add(product.id);
    }
  }

  canManageReview(review: Review): boolean {
    return this.auth.currentUser()?.id === review.userId;
  }

  async submitReview(product: Product): Promise<void> {
    if (this.reviewForm.invalid) return;
    const value = this.reviewForm.getRawValue();
    try {
      if (this.editingReviewId()) {
        await this.service.updateReview(this.editingReviewId(), { ...value, comment: value.comment || undefined });
      } else {
        await this.service.createReview(product.id, { ...value, comment: value.comment || undefined });
      }
      this.reviewForm.reset({ rating: 5, title: '', comment: '' });
      this.editingReviewId.set('');
      this.reviews.set((await this.service.reviews(product.id)).items);
      this.notifications.success('Review saved.');
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Unable to submit review.');
    }
  }

  startEditReview(review: Review): void {
    this.editingReviewId.set(review.id);
    this.reviewForm.setValue({ rating: review.rating, title: review.title, comment: review.comment ?? '' });
    this.activeTab.set('reviews');
  }

  cancelEditReview(): void {
    this.editingReviewId.set('');
    this.reviewForm.reset({ rating: 5, title: '', comment: '' });
  }

  async deleteReview(review: Review): Promise<void> {
    const product = this.product();
    if (!product) return;
    try {
      await this.service.deleteReview(review.id);
      this.reviews.set((await this.service.reviews(product.id)).items);
      this.notifications.success('Review deleted.');
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Unable to delete review.');
    }
  }

  private currentProductUrl(): string {
    return `/products/${this.route.snapshot.paramMap.get('slug') ?? ''}`;
  }
}
