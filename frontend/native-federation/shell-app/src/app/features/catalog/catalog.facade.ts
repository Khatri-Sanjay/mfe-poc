import { Injectable, computed, inject, signal } from '@angular/core';
import { PaginationMeta } from '../../core/http/api-response.model';
import { Brand, Category, Product, ProductQuery } from '../../core/models/commerce.models';
import { NotificationService } from '../../state/ui/notification.service';
import { CatalogService } from './catalog.service';

@Injectable({ providedIn: 'root' })
export class CatalogFacade {
  private readonly service = inject(CatalogService);
  private readonly notifications = inject(NotificationService);

  readonly products = signal<Product[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly brands = signal<Brand[]>([]);
  readonly meta = signal<PaginationMeta | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly query = signal<ProductQuery>({ page: 1, limit: 12, inStock: true, sortBy: 'createdAt', sortOrder: 'desc' });
  readonly featured = computed(() => this.products().slice(0, 4));

  async init(): Promise<void> {
    this.loading.set(true);
    try {
      const [categories, brands] = await Promise.all([this.service.categories(), this.service.brands()]);
      this.categories.set(categories);
      this.brands.set(brands);
      await this.search();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loading.set(false);
    }
  }

  async search(patch: ProductQuery = {}): Promise<void> {
    this.loading.set(true);
    this.error.set('');
    this.query.update((query) => ({ ...query, ...patch }));
    try {
      const result = await this.service.products(this.query());
      this.products.set(result.items);
      this.meta.set(result.meta);
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loading.set(false);
    }
  }

  private handleError(error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unable to load catalog.';
    this.error.set(message);
    this.notifications.error(message);
  }
}
