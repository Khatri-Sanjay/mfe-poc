import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { CheckoutQuote, CheckoutResult, ShippingMethod } from '../../core/models/commerce.models';

export interface CheckoutPayload {
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethodId: string;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly api = inject(ApiClient);

  shippingMethods(): Promise<ShippingMethod[]> {
    return this.api.get<ShippingMethod[]>('/shipping/methods');
  }

  quote(shippingMethodId?: string): Promise<CheckoutQuote> {
    return this.api.post<CheckoutQuote>('/checkout/quote', shippingMethodId ? { shippingMethodId } : {});
  }

  checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
    return this.api.post<CheckoutResult>('/checkout', payload, { 'Idempotency-Key': crypto.randomUUID() });
  }
}
