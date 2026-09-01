import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Product, ProductVariant, Review } from '../../core/models/commerce.models';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MoneyPipe } from '../../shared/pipes/money.pipe';
import { AuthFacade } from '../../state/auth/auth.facade';
import { CartFacade } from '../../state/cart/cart.facade';
import { NotificationService } from '../../state/ui/notification.service';
import { WishlistFacade } from '../wishlist/wishlist.facade';
import { CatalogService } from './catalog.service';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, MoneyPipe, EmptyStateComponent],
  template: `
    @if (product(); as item) {
      <section class="product-detail">
        <div class="gallery">
          <img [src]="mainImage()" [alt]="item.name" />
          <div>
            @for (image of item.images; track image.id) {
              <button type="button" (click)="selectedImage.set(image.url)"><img [src]="image.url" [alt]="image.altText || item.name" /></button>
            }
          </div>
        </div>
        <article class="detail-copy">
          <a class="breadcrumb-link" routerLink="/products">Products</a>
          <p class="eyebrow">{{ item.brand?.name || 'Independent' }}</p>
          <h1>{{ item.name }}</h1>
          <div class="product-row">
            <strong class="price">{{ selectedVariant()?.price | money:selectedVariant()?.currency }}</strong>
            <span class="rating"><i class="bi bi-star-fill"></i>{{ item.averageRating || 0 }} ({{ item.reviewCount }})</span>
          </div>
          <p>{{ item.description || item.shortDescription }}</p>
          <label>
            Variant
            <select [formControl]="variantControl">
              @for (variant of item.variants; track variant.id) {
                <option [value]="variant.id">{{ variant.name }} - {{ variant.quantityAvailable }} available</option>
              }
            </select>
          </label>
          <label>
            Quantity
            <input type="number" min="1" [formControl]="quantityControl" />
          </label>
          <div class="product-actions">
            <button class="btn-primary" type="button" [disabled]="!selectedVariant()" (click)="addToCart(item)">Add to cart</button>
            <button class="btn-secondary" type="button" (click)="wishlist.add(item.id)">Save to wishlist</button>
          </div>
          <div class="tag-list">
            @for (category of item.categories; track category.id) { <span>{{ category.name }}</span> }
          </div>
        </article>
      </section>

      <section class="content-section">
        <div class="section-heading"><h2>Reviews</h2></div>
        @for (review of reviews(); track review.id) {
          <article class="review-card">
            <div><strong>{{ review.title }}</strong><span>{{ review.rating }}/5</span></div>
            <p>{{ review.comment || 'No comment provided.' }}</p>
            @if (review.verifiedPurchase) { <small>Verified purchase</small> }
            @if (canManageReview(review)) {
              <div class="inline-actions">
                <button class="btn-secondary compact" type="button" (click)="startEditReview(review)">Edit</button>
                <button class="btn-secondary compact danger-text" type="button" (click)="deleteReview(review)">Delete</button>
              </div>
            }
          </article>
        } @empty {
          <app-empty-state title="No reviews yet" message="Approved customer reviews will appear here." />
        }
        @if (auth.isAuthenticated()) {
          <form class="review-form" [formGroup]="reviewForm" (ngSubmit)="submitReview(item)">
            <select formControlName="rating">
              <option [ngValue]="5">5 stars</option>
              <option [ngValue]="4">4 stars</option>
              <option [ngValue]="3">3 stars</option>
              <option [ngValue]="2">2 stars</option>
              <option [ngValue]="1">1 star</option>
            </select>
            <input formControlName="title" placeholder="Review title" />
            <textarea formControlName="comment" placeholder="Review text"></textarea>
            <div class="inline-actions">
              <button class="btn-secondary" type="submit" [disabled]="reviewForm.invalid">{{ editingReviewId() ? 'Update review' : 'Submit review' }}</button>
              @if (editingReviewId()) {
                <button class="btn-secondary" type="button" (click)="cancelEditReview()">Cancel edit</button>
              }
            </div>
          </form>
        }
      </section>
    }
  `,
})
export class ProductDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(CatalogService);
  private readonly cart = inject(CartFacade);
  private readonly notifications = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  readonly auth = inject(AuthFacade);
  readonly wishlist = inject(WishlistFacade);
  readonly product = signal<Product | null>(null);
  readonly reviews = signal<Review[]>([]);
  readonly selectedImage = signal('');
  readonly editingReviewId = signal('');

  readonly variantControl = new FormControl('', { nonNullable: true });
  readonly quantityControl = new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] });
  readonly reviewForm = new FormGroup({
    rating: new FormControl(5, { nonNullable: true, validators: [Validators.min(1), Validators.max(5)] }),
    title: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(160)] }),
    comment: new FormControl('', { nonNullable: true }),
  });

  async ngOnInit(): Promise<void> {
    const slug = this.route.snapshot.paramMap.get('slug') ?? '';
    const product = await this.service.productBySlug(slug);
    this.product.set(product);
    this.variantControl.setValue(product.variants[0]?.id ?? '');
    this.selectedImage.set(product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? '');
    this.reviews.set((await this.service.reviews(product.id)).items);
  }

  mainImage(): string {
    return this.selectedImage() || 'https://placehold.co/1000x850/f4f7f6/19302d?text=Product';
  }

  selectedVariant(): ProductVariant | null {
    return this.product()?.variants.find((variant) => variant.id === this.variantControl.value) ?? null;
  }

  async addToCart(product: Product): Promise<void> {
    const variant = this.selectedVariant();
    if (!variant) return;
    await this.cart.addProduct({ ...product, variants: [variant] }, this.quantityControl.value);
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

  canManageReview(review: Review): boolean {
    return this.auth.currentUser()?.id === review.userId;
  }

  startEditReview(review: Review): void {
    this.editingReviewId.set(review.id);
    this.reviewForm.setValue({ rating: review.rating, title: review.title, comment: review.comment ?? '' });
  }

  cancelEditReview(): void {
    this.editingReviewId.set('');
    this.reviewForm.reset({ rating: 5, title: '', comment: '' });
  }

  async deleteReview(review: Review): Promise<void> {
    const product = this.product();
    if (!product) return;
    if (await this.confirmDialog.confirm('Delete review', 'Delete this review permanently?', 'Delete review')) {
      try {
        await this.service.deleteReview(review.id);
        this.reviews.set((await this.service.reviews(product.id)).items);
        this.notifications.success('Review deleted.');
      } catch (error) {
        this.notifications.error(error instanceof Error ? error.message : 'Unable to delete review.');
      }
    }
  }
}
