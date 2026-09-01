import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { PaginatedData } from '../../core/http/api-response.model';
import { Order } from '../../core/models/commerce.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly api = inject(ApiClient);

  list(page = 1, limit = 20): Promise<PaginatedData<Order[]>> {
    return this.api.getPage<Order>('/orders', { page, limit });
  }

  get(id: string): Promise<Order> {
    return this.api.get<Order>(`/orders/${id}`);
  }

  cancel(id: string): Promise<Order> {
    return this.api.post<Order>(`/orders/${id}/cancel`);
  }
}
