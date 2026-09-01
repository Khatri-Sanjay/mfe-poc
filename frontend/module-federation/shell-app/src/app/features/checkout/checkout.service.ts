import { inject, Injectable } from "@angular/core";
import { ApiClient } from "../../core/http/api-client.service";
import {
  Address,
  CheckoutPayload,
  CheckoutQuote,
  CheckoutResult,
  CreateAddressPayload,
  Order,
  ShippingMethod,
} from "../../core/models/commerce.models";

@Injectable({ providedIn: "root" })
export class CheckoutService {
  private api = inject(ApiClient);

  getAddresses(): Promise<Address[]> {
    return this.api.get<Address[]>("/users/me/addresses");
  }

  createAddress(payload: CreateAddressPayload): Promise<Address> {
    return this.api.post<Address>("/users/me/addresses", payload);
  }

  updateAddress(
    id: string,
    payload: Partial<CreateAddressPayload>
  ): Promise<Address> {
    return this.api.patch<Address>(`/users/me/addresses/${id}`, payload);
  }

  deleteAddress(id: string): Promise<void> {
    return this.api.delete<void>(`/users/me/addresses/${id}`);
  }

  getShippingMethods(): Promise<ShippingMethod[]> {
    return this.api.get<ShippingMethod[]>("/shipping/methods");
  }

  getQuote(shippingMethodId?: string): Promise<CheckoutQuote> {
    return this.api.post<CheckoutQuote>("/checkout/quote", {
      shippingMethodId,
    });
  }

  checkout(payload: CheckoutPayload): Promise<CheckoutResult> {
    return this.api.post<CheckoutResult>("/checkout", payload);
  }

  getOrders(page = 1, limit = 20): Promise<Order[]> {
    return this.api.get<Order[]>("/orders", { page, limit });
  }

  getOrder(id: string): Promise<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  cancelOrder(id: string): Promise<Order> {
    return this.api.post<Order>(`/orders/${id}/cancel`, {});
  }
}
