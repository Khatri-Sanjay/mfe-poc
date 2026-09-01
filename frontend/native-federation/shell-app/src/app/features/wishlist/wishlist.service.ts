import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { Wishlist } from '../../core/models/commerce.models';

@Injectable({ providedIn: 'root' })
export class WishlistService {
  private readonly api = inject(ApiClient);

  get(): Promise<Wishlist> {
    return this.api.get<Wishlist>('/wishlist');
  }

  add(productId: string): Promise<Wishlist> {
    return this.api.post<Wishlist>('/wishlist/items', { productId });
  }

  remove(productId: string): Promise<Wishlist> {
    return this.api.delete<Wishlist>(`/wishlist/items/${productId}`);
  }
}
