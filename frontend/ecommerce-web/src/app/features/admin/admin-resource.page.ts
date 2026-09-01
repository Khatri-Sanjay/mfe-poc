import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ConfirmDialogService } from '../../shared/components/confirm-dialog/confirm-dialog.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { NotificationService } from '../../state/ui/notification.service';
import { AdminFormValue, AdminProductForm, AdminUserForm, UserStatus } from './admin-resource.models';
import { AdminField, AdminResourceConfig, AdminService } from './admin.service';
import { AdminResourceEditorComponent } from './components/admin-resource-editor.component';
import { AdminResourceTableComponent } from './components/admin-resource-table.component';
import { Brand, Category } from '../../core/models/commerce.models';

@Component({
  standalone: true,
  imports: [EmptyStateComponent, AdminResourceTableComponent, AdminResourceEditorComponent],
  template: `
    @if (resource(); as current) {
      <section class="admin-page-content">
        <section class="resource-hero">
          <div>
            <p class="eyebrow">Operations</p>
            <h1>{{ current.title }}</h1>
            <p>{{ resourceDescription(current.key) }}</p>
          </div>
          <div class="resource-actions">
            <button class="btn-secondary" type="button" (click)="load()"><i class="bi bi-arrow-repeat"></i> Refresh</button>
            @if (current.creatable) {
              <button class="btn-primary" type="button" (click)="prepareCreate(current)">
                <i class="bi bi-plus-lg"></i> New {{ singular(current.title) }}
              </button>
            }
          </div>
        </section>

        <section class="resource-workspace">
          <app-admin-resource-table
            [resource]="current"
            [allRows]="rows()"
            [rows]="filteredRows()"
            [columns]="columns()"
            [search]="search()"
            (searchChange)="search.set($event)"
            (refresh)="load()"
            (edit)="prepareEdit(current, $event)"
            (remove)="delete(current, $event)"
          />

          <app-admin-resource-editor
            [resource]="current"
            [editId]="editId()"
            [response]="response()"
            [form]="form"
            [userForm]="userForm"
            [productForm]="productForm"
            [brands]="brands()"
            [categories]="categories()"
            [availableRoles]="availableRoles"
            [refundOrderId]="refundOrderId"
            (refundOrderIdChange)="refundOrderId = $event"
            (submit)="submit(current)"
            (reset)="resetEditor(current)"
            (removeProductImage)="removeProductImage($event)"
            (removeProductVariant)="removeProductVariant($event)"
          />
        </section>
      </section>
    } @else {
      <app-empty-state title="Admin section unavailable" message="This admin route is not mapped to a backend endpoint." />
    }
  `,
})
export class AdminResourcePage implements OnInit {
  readonly service = inject(AdminService);
  private readonly route = inject(ActivatedRoute);
  private readonly notifications = inject(NotificationService);
  private readonly confirmDialog = inject(ConfirmDialogService);

  readonly resource = signal<AdminResourceConfig | null>(null);
  readonly rows = signal<Record<string, unknown>[]>([]);
  readonly response = signal<unknown>(null);
  readonly editId = signal('');
  readonly search = signal('');
  readonly brands = signal<Brand[]>([]);
  readonly categories = signal<Category[]>([]);
  readonly columns = computed(() => this.visibleColumns(this.rows()[0]));
  readonly filteredRows = computed(() => {
    const term = this.search().toLowerCase();
    if (!term) return this.rows();
    return this.rows().filter((row) => JSON.stringify(row).toLowerCase().includes(term));
  });

  readonly availableRoles = ['CUSTOMER', 'ADMIN', 'SUPER_ADMIN'];
  refundOrderId = '';
  form: Record<string, AdminFormValue> = {};
  userForm: AdminUserForm = this.emptyUserForm();
  productForm: AdminProductForm = this.emptyProductForm();

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const key = params.get('resource');
      const resource = this.service.resources.find((item) => item.key === key) ?? null;
      this.resource.set(resource);
      this.rows.set([]);
      this.search.set('');
      if (resource) {
        this.resetEditor(resource);
        if (resource.key === 'products') void this.loadProductLookups();
        void this.load();
      }
    });
  }

  async load(): Promise<void> {
    const resource = this.resource();
    if (!resource || resource.key === 'refunds') return;
    try {
      const data = await this.service.list(resource);
      this.rows.set(this.toRows(data));
      this.response.set(data);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Unable to load admin resource.');
    }
  }

  prepareCreate(resource: AdminResourceConfig): void {
    this.editId.set('');
    if (resource.key === 'users') {
      this.userForm = this.emptyUserForm();
      return;
    }
    if (resource.key === 'products') {
      this.productForm = this.emptyProductForm();
      return;
    }
    this.form = this.bodyToForm(resource, resource.sampleBody);
  }

  prepareEdit(resource: AdminResourceConfig, row: Record<string, unknown>): void {
    this.editId.set(this.idOf(row));
    if (resource.key === 'users') {
      this.userForm = this.rowToUserForm(row);
      return;
    }
    if (resource.key === 'products') {
      this.productForm = this.rowToProductForm(row);
      return;
    }
    this.form = this.bodyToForm(resource, this.editPayload(resource, row));
  }

  async submit(resource: AdminResourceConfig): Promise<void> {
    if (resource.key === 'users') {
      await this.submitUser(resource);
      return;
    }
    if (resource.key === 'products') {
      await this.submitProduct(resource);
      return;
    }
    if (this.editId()) await this.update(resource);
    else await this.create(resource);
  }

  async create(resource: AdminResourceConfig): Promise<void> {
    if (!resource.creatable) return;
    try {
      const body = this.formToBody(resource);
      const path = resource.key === 'refunds' ? `/admin/orders/${this.refundOrderId}/refunds` : undefined;
      this.response.set(await this.service.create(resource, body, path));
      this.notifications.success(`${resource.title} created.`);
      await this.load();
      this.resetEditor(resource);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Create action failed.');
    }
  }

  async update(resource: AdminResourceConfig): Promise<void> {
    if (!this.editId() || !resource.editable) return;
    try {
      this.response.set(await this.service.update(resource, this.editId(), this.formToBody(resource)));
      this.notifications.success(`${resource.title} updated.`);
      await this.load();
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Update action failed.');
    }
  }

  async delete(resource: AdminResourceConfig, row: Record<string, unknown>): Promise<void> {
    const id = this.idOf(row);
    if (!id) return;
    if (await this.confirmDialog.confirm(`Delete ${this.singular(resource.title)}`, 'This action cannot be undone.', 'Delete')) {
      try {
        this.response.set(await this.service.delete(resource, id));
        this.notifications.success(`${this.singular(resource.title)} deleted.`);
        await this.load();
      } catch (error) {
        this.notifications.error(error instanceof Error ? error.message : 'Delete action failed.');
      }
    }
  }

  resetEditor(resource: AdminResourceConfig): void {
    this.editId.set('');
    this.refundOrderId = '';
    if (resource.key === 'users') {
      this.userForm = this.emptyUserForm();
      return;
    }
    if (resource.key === 'products') {
      this.productForm = this.emptyProductForm();
      return;
    }
    this.form = this.bodyToForm(resource, resource.sampleBody);
  }

  async submitUser(resource: AdminResourceConfig): Promise<void> {
    if (this.userForm.roles.length === 0) {
      this.notifications.warning('Select at least one role before saving the user.');
      return;
    }

    try {
      const body = this.userFormToBody();
      this.response.set(this.editId() ? await this.service.update(resource, this.editId(), body) : await this.service.create(resource, body));
      this.notifications.success(this.editId() ? 'User updated.' : 'User created.');
      await this.load();
      this.resetEditor(resource);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'User save failed.');
    }
  }

  singular(title: string): string {
    if (title === 'Categories') return 'Category';
    if (title.endsWith('ies')) return `${title.slice(0, -3)}y`;
    if (title.endsWith('s')) return title.slice(0, -1);
    return title;
  }

  resourceDescription(key: string): string {
    const descriptions: Record<string, string> = {
      users: 'Review customers, update account status, and assign roles through a guided user form.',
      products: 'Maintain merchandising content, images, categories, and variants through the product API contract.',
      categories: 'Manage catalog taxonomy, parent categories, merchandising order, and active state.',
      brands: 'Maintain brand profiles, logos, websites, and storefront visibility.',
      inventory: 'Inspect stock records and post controlled quantity adjustments by variant.',
      orders: 'Review customer orders and progress statuses through allowed backend transitions.',
      refunds: 'Create refunds against existing orders when the API permits it.',
      coupons: 'Create and maintain promotional discount codes, limits, and active dates.',
      shipping: 'Manage public shipping methods, pricing, and delivery estimates.',
      reviews: 'Moderate customer reviews and remove inappropriate content.',
    };
    return descriptions[key] ?? 'Manage this backend resource.';
  }

  async submitProduct(resource: AdminResourceConfig): Promise<void> {
    if (this.productForm.variants.length === 0) {
      this.notifications.warning('Add at least one product variant before saving.');
      return;
    }

    try {
      if (this.editId()) {
        const productId = this.editId();
        this.response.set(await this.service.updateProduct(productId, this.productBaseBody()));
        await this.syncProductImages(productId);
        await this.syncProductVariants(productId);
        this.notifications.success('Product updated.');
      } else {
        this.response.set(await this.service.createProduct(this.productCreateBody()));
        this.notifications.success('Product created.');
      }
      await this.load();
      this.resetEditor(resource);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Product save failed.');
    }
  }

  async removeProductImage(index: number): Promise<void> {
    const image = this.productForm.images[index];
    if (!image) return;
    if (this.editId() && image.id) {
      if (!(await this.confirmDialog.confirm('Delete product image', 'This image will be removed from the product.', 'Delete'))) return;
      try {
        await this.service.deleteProductImage(this.editId(), image.id);
        this.notifications.success('Product image deleted.');
      } catch (error) {
        this.notifications.error(error instanceof Error ? error.message : 'Image delete failed.');
        return;
      }
    }
    this.productForm = {
      ...this.productForm,
      images: this.productForm.images.filter((_, currentIndex) => currentIndex !== index),
    };
  }

  async removeProductVariant(index: number): Promise<void> {
    const variant = this.productForm.variants[index];
    if (!variant) return;
    if (this.productForm.variants.length === 1) {
      this.notifications.warning('A product must have at least one variant.');
      return;
    }
    if (this.editId() && variant.id) {
      if (!(await this.confirmDialog.confirm('Delete product variant', 'This variant will be removed from the product.', 'Delete'))) return;
      try {
        await this.service.deleteProductVariant(this.editId(), variant.id);
        this.notifications.success('Product variant deleted.');
      } catch (error) {
        this.notifications.error(error instanceof Error ? error.message : 'Variant delete failed.');
        return;
      }
    }
    this.productForm = {
      ...this.productForm,
      variants: this.productForm.variants.filter((_, currentIndex) => currentIndex !== index),
    };
  }

  private visibleColumns(first: Record<string, unknown> | undefined): string[] {
    if (!first) return ['id'];
    const preferred = ['id', 'name', 'email', 'code', 'status', 'sku', 'productName', 'grandTotal', 'price', 'quantityAvailable', 'isActive', 'usageCount'];
    return Object.keys(first)
      .filter((key) => preferred.includes(key))
      .slice(0, 6);
  }

  private bodyToForm(resource: AdminResourceConfig, body: unknown): Record<string, AdminFormValue> {
    const source = isRecord(body) ? body : {};
    return resource.fields.reduce<Record<string, AdminFormValue>>((form, field) => {
      const value = source[field.key];
      if (field.type === 'checkbox') form[field.key] = Boolean(value);
      else if (field.type === 'json') form[field.key] = value === undefined ? '' : JSON.stringify(value, null, 2);
      else if (field.type === 'number') form[field.key] = typeof value === 'number' ? value : Number(value ?? 0);
      else form[field.key] = value === undefined || value === null ? '' : String(value);
      return form;
    }, {});
  }

  private formToBody(resource: AdminResourceConfig): Record<string, unknown> {
    return resource.fields.reduce<Record<string, unknown>>((body, field) => {
      const value = this.form[field.key];
      if (this.shouldSkip(field, value)) return body;
      if (field.type === 'checkbox') body[field.key] = Boolean(value);
      else if (field.type === 'json') body[field.key] = typeof value === 'string' && value.trim() ? JSON.parse(value) : undefined;
      else if (field.type === 'number') body[field.key] = Number(value);
      else body[field.key] = value;
      return body;
    }, {});
  }

  private shouldSkip(field: AdminField, value: AdminFormValue | undefined): boolean {
    if (field.required) return false;
    return value === undefined || value === '' || value === null;
  }

  private editPayload(resource: AdminResourceConfig, row: Record<string, unknown>): unknown {
    if (resource.key === 'orders') return { status: row['status'] ?? 'PROCESSING', note: 'Admin status update' };
    if (resource.key === 'reviews') return { status: row['status'] ?? 'APPROVED' };
    if (resource.key === 'inventory') return resource.sampleBody;
    return row;
  }

  private toRows(data: unknown): Record<string, unknown>[] {
    if (Array.isArray(data)) return data.filter(isRecord);
    if (isRecord(data) && Array.isArray(data['items'])) return data['items'].filter(isRecord);
    return [];
  }

  private idOf(row: Record<string, unknown>): string {
    const id = row['id'] ?? row['variantId'];
    return typeof id === 'string' ? id : '';
  }

  private emptyUserForm(): AdminUserForm {
    return {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      password: 'Strong-password-123',
      status: 'ACTIVE',
      emailVerified: false,
      roles: ['CUSTOMER'],
    };
  }

  private emptyProductForm(): AdminProductForm {
    return {
      name: '',
      slug: '',
      shortDescription: '',
      description: '',
      status: 'DRAFT',
      brandId: '',
      categoryIds: [],
      seoTitle: '',
      seoDescription: '',
      images: [{ url: '', altText: '', sortOrder: 0, isPrimary: true }],
      variants: [this.emptyProductVariant()],
    };
  }

  private emptyProductVariant() {
    return {
      sku: '',
      barcode: '',
      name: 'Default',
      optionName: '',
      optionValue: '',
      price: '0.00',
      compareAtPrice: '',
      costPrice: '',
      currency: 'AUD',
      weight: '',
      quantityOnHand: 0,
      isActive: true,
    };
  }

  private rowToProductForm(row: Record<string, unknown>): AdminProductForm {
    const brand = isRecord(row['brand']) ? row['brand'] : null;
    const categories = Array.isArray(row['categories']) ? row['categories'].filter(isRecord) : [];
    const images = Array.isArray(row['images']) ? row['images'].filter(isRecord) : [];
    const variants = Array.isArray(row['variants']) ? row['variants'].filter(isRecord) : [];

    return {
      name: String(row['name'] ?? ''),
      slug: String(row['slug'] ?? ''),
      shortDescription: String(row['shortDescription'] ?? ''),
      description: String(row['description'] ?? ''),
      status: row['status'] === 'ACTIVE' || row['status'] === 'ARCHIVED' ? row['status'] : 'DRAFT',
      brandId: brand && typeof brand['id'] === 'string' ? brand['id'] : '',
      categoryIds: categories.map((category) => category['id']).filter((id): id is string => typeof id === 'string'),
      seoTitle: '',
      seoDescription: '',
      images: images.length
        ? images.map((image, index) => ({
            id: typeof image['id'] === 'string' ? image['id'] : undefined,
            url: String(image['url'] ?? ''),
            altText: String(image['altText'] ?? ''),
            sortOrder: Number(image['sortOrder'] ?? index),
            isPrimary: Boolean(image['isPrimary']),
          }))
        : [{ url: '', altText: '', sortOrder: 0, isPrimary: true }],
      variants: variants.length
        ? variants.map((variant) => {
            const options = isRecord(variant['options']) ? Object.entries(variant['options']) : [];
            const [optionName, optionValue] = options.length ? options[0] : ['', ''];
            return {
              id: typeof variant['id'] === 'string' ? variant['id'] : undefined,
              sku: String(variant['sku'] ?? ''),
              barcode: String(variant['barcode'] ?? ''),
              name: String(variant['name'] ?? ''),
              optionName,
              optionValue: String(optionValue ?? ''),
              price: String(variant['price'] ?? '0.00'),
              compareAtPrice: String(variant['compareAtPrice'] ?? ''),
              costPrice: '',
              currency: String(variant['currency'] ?? 'AUD'),
              weight: '',
              quantityOnHand: Number(variant['quantityAvailable'] ?? 0),
              isActive: Boolean(variant['isActive'] ?? true),
            };
          })
        : [this.emptyProductVariant()],
    };
  }

  private productBaseBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      name: this.productForm.name,
      status: this.productForm.status,
      categoryIds: this.productForm.categoryIds,
    };
    if (this.productForm.slug.trim()) body['slug'] = this.productForm.slug.trim();
    if (this.productForm.shortDescription.trim()) body['shortDescription'] = this.productForm.shortDescription.trim();
    if (this.productForm.description.trim()) body['description'] = this.productForm.description.trim();
    if (this.productForm.brandId) body['brandId'] = this.productForm.brandId;
    if (this.productForm.seoTitle.trim()) body['seoTitle'] = this.productForm.seoTitle.trim();
    if (this.productForm.seoDescription.trim()) body['seoDescription'] = this.productForm.seoDescription.trim();
    return body;
  }

  private productCreateBody(): Record<string, unknown> {
    return {
      ...this.productBaseBody(),
      images: this.productForm.images.filter((image) => image.url.trim()).map((image) => this.imageBody(image)),
      variants: this.productForm.variants.map((variant) => this.variantBody(variant)),
    };
  }

  private imageBody(image: AdminProductForm['images'][number]): Record<string, unknown> {
    const body: Record<string, unknown> = {
      url: image.url,
      sortOrder: Number(image.sortOrder),
      isPrimary: image.isPrimary,
    };
    if (image.altText.trim()) body['altText'] = image.altText.trim();
    return body;
  }

  private variantBody(variant: AdminProductForm['variants'][number]): Record<string, unknown> {
    const options = variant.optionName.trim() && variant.optionValue.trim() ? { [variant.optionName.trim()]: variant.optionValue.trim() } : {};
    const body: Record<string, unknown> = {
      sku: variant.sku,
      name: variant.name,
      options,
      price: variant.price,
      currency: variant.currency,
      isActive: variant.isActive,
      quantityOnHand: Number(variant.quantityOnHand),
    };
    if (variant.barcode.trim()) body['barcode'] = variant.barcode.trim();
    if (variant.compareAtPrice.trim()) body['compareAtPrice'] = variant.compareAtPrice.trim();
    if (variant.costPrice.trim()) body['costPrice'] = variant.costPrice.trim();
    if (variant.weight.trim()) body['weight'] = variant.weight.trim();
    return body;
  }

  private async syncProductImages(productId: string): Promise<void> {
    for (const image of this.productForm.images.filter((item) => item.url.trim())) {
      if (image.id) await this.service.updateProductImage(productId, image.id, this.imageBody(image));
      else await this.service.addProductImage(productId, this.imageBody(image));
    }
  }

  private async syncProductVariants(productId: string): Promise<void> {
    for (const variant of this.productForm.variants) {
      if (variant.id) await this.service.updateProductVariant(productId, variant.id, this.variantBody(variant));
      else await this.service.addProductVariant(productId, this.variantBody(variant));
    }
  }

  private async loadProductLookups(): Promise<void> {
    try {
      const [brands, categories] = await Promise.all([this.service.listBrands(), this.service.listCategories()]);
      this.brands.set(brands);
      this.categories.set(categories);
    } catch (error) {
      this.notifications.error(error instanceof Error ? error.message : 'Unable to load product form lookups.');
    }
  }

  private rowToUserForm(row: Record<string, unknown>): AdminUserForm {
    return {
      firstName: String(row['firstName'] ?? ''),
      lastName: String(row['lastName'] ?? ''),
      email: String(row['email'] ?? ''),
      phone: String(row['phone'] ?? ''),
      password: '',
      status: this.toUserStatus(row['status']),
      emailVerified: Boolean(row['emailVerified']),
      roles: Array.isArray(row['roles']) ? row['roles'].filter((role): role is string => typeof role === 'string') : ['CUSTOMER'],
    };
  }

  private userFormToBody(): Record<string, unknown> {
    const body: Record<string, unknown> = {
      firstName: this.userForm.firstName,
      lastName: this.userForm.lastName,
      email: this.userForm.email,
      status: this.userForm.status,
      emailVerified: this.userForm.emailVerified,
      roles: this.userForm.roles,
    };

    if (this.userForm.phone.trim()) body['phone'] = this.userForm.phone.trim();
    if (!this.editId()) body['password'] = this.userForm.password;

    return body;
  }

  private toUserStatus(value: unknown): UserStatus {
    return value === 'INACTIVE' || value === 'SUSPENDED' ? value : 'ACTIVE';
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
