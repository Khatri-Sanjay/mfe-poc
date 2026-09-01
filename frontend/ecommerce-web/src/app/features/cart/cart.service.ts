import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { Cart } from '../../core/models/commerce.models';

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(ApiClient);

  get(): Promise<Cart> {
    return this.api.get<Cart>('/cart');
  }

  add(variantId: string, quantity: number): Promise<Cart> {
    return this.api.post<Cart>('/cart/items', { variantId, quantity });
  }

  update(itemId: string, quantity: number): Promise<Cart> {
    return this.api.patch<Cart>(`/cart/items/${itemId}`, { quantity });
  }

  remove(itemId: string): Promise<Cart> {
    return this.api.delete<Cart>(`/cart/items/${itemId}`);
  }

  clear(): Promise<void> {
    return this.api.delete<void>('/cart');
  }

  applyCoupon(code: string): Promise<Cart> {
    return this.api.post<Cart>('/cart/coupon', { code });
  }

  removeCoupon(): Promise<Cart> {
    return this.api.delete<Cart>('/cart/coupon');
  }
}
