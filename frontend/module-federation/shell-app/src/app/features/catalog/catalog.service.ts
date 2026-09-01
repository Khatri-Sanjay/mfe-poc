import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { PaginatedData } from '../../core/http/api-response.model';
import { Brand, Category, Product, ProductQuery, Review, ReviewPayload } from '../../core/models/commerce.models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly api = inject(ApiClient);

  categories(): Promise<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  brands(): Promise<Brand[]> {
    return this.api.get<Brand[]>('/brands');
  }

  products(query: ProductQuery): Promise<PaginatedData<Product[]>> {
    return this.api.getPage<Product>('/products', query);
  }

  productBySlug(slug: string): Promise<Product> {
    return this.api.get<Product>(`/products/slug/${slug}`);
  }

  reviews(productId: string, page = 1, limit = 10): Promise<PaginatedData<Review[]>> {
    return this.api.getPage<Review>(`/products/${productId}/reviews`, { page, limit });
  }

  createReview(productId: string, payload: ReviewPayload): Promise<Review> {
    return this.api.post<Review>(`/products/${productId}/reviews`, payload);
  }

  updateReview(reviewId: string, payload: Partial<ReviewPayload>): Promise<Review> {
    return this.api.patch<Review>(`/reviews/${reviewId}`, payload);
  }

  deleteReview(reviewId: string): Promise<void> {
    return this.api.delete<void>(`/reviews/${reviewId}`);
  }
}
