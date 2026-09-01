import { Component, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { Brand, Category } from '../../../core/models/product.model';
import { ToastService } from '../../../shared/components/toast/toast.service';

@Component({
  selector: 'app-product-editor',
  imports: [FormsModule],
  template: `
    <div class="admin-page-content">
      <div class="resource-workspace">
        <div class="form-section">
          <div class="form-section-heading">
            <i class="bi bi-info-circle"></i>
            <div>
              <strong>Basic Info</strong>
              <span>Product name and description</span>
            </div>
          </div>
          <div class="resource-form">
            <label>
              Name
              <input type="text" [(ngModel)]="form.name" required placeholder="Product name" />
            </label>
            <label>
              Slug
              <input type="text" [(ngModel)]="form.slug" placeholder="auto-generated" />
            </label>
            <label class="span-2">
              Short Description
              <textarea
                [(ngModel)]="form.shortDescription"
                placeholder="Brief description"
              ></textarea>
            </label>
            <label class="span-2">
              Description
              <textarea
                [(ngModel)]="form.description"
                placeholder="Full description"
                style="min-height:10rem"
              ></textarea>
            </label>
          </div>
        </div>
        <div class="form-section">
          <div class="form-section-heading">
            <i class="bi bi-tag"></i>
            <div>
              <strong>Organization</strong>
              <span>Brand, categories, and status</span>
            </div>
          </div>
          <div class="resource-form">
            <label>
              Status
              <select [(ngModel)]="form.status">
                <option value="DRAFT">Draft</option>
                <option value="ACTIVE">Active</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </label>
            <label>
              Brand
              <select [(ngModel)]="form.brandId">
                <option value="">None</option>
                @for (brand of brands(); track brand.id) {
                  <option [value]="brand.id">{{ brand.name }}</option>
                }
              </select>
            </label>
            <div class="span-2">
              <label>Categories</label>
              <div class="category-picker">
                @for (cat of categories(); track cat.id) {
                  <label
                    class="category-option"
                    [class.selected]="form.categoryIds.includes(cat.id)"
                  >
                    <input
                      type="checkbox"
                      [checked]="form.categoryIds.includes(cat.id)"
                      (change)="toggleCategory(cat.id)"
                    />
                    {{ cat.name }}
                  </label>
                }
              </div>
            </div>
          </div>
        </div>
        <div class="form-section">
          <div class="form-section-heading">
            <i class="bi bi-box"></i>
            <div>
              <strong>Variants</strong>
              <span>Pricing and inventory</span>
            </div>
          </div>
          @for (variant of form.variants; track $index; let i = $index) {
            <div class="variant-editor-card">
              <div class="variant-card-heading">
                <strong>Variant {{ i + 1 }}</strong>
                @if (form.variants.length > 1) {
                  <button class="icon-btn danger compact" (click)="removeVariant(i)">
                    <i class="bi bi-trash"></i>
                  </button>
                }
              </div>
              <div class="resource-form">
                <label>
                  SKU
                  <input type="text" [(ngModel)]="variant.sku" required placeholder="SKU-001" />
                </label>
                <label>
                  Name
                  <input type="text" [(ngModel)]="variant.name" required placeholder="Default" />
                </label>
                <label>
                  Price
                  <input
                    type="text"
                    [(ngModel)]="variant.price"
                    required
                    placeholder="99.99"
                    inputmode="decimal"
                  />
                </label>
                <label>
                  Compare At Price
                  <input
                    type="text"
                    [(ngModel)]="variant.compareAtPrice"
                    placeholder="129.99"
                    inputmode="decimal"
                  />
                </label>
                <label>
                  Quantity
                  <input type="number" [(ngModel)]="variant.quantityOnHand" min="0" />
                </label>
                <label>
                  Currency
                  <input
                    type="text"
                    [(ngModel)]="variant.currency"
                    placeholder="AUD"
                    maxlength="3"
                  />
                </label>
              </div>
            </div>
          }
          <button class="btn-secondary" (click)="addVariant()">
            <i class="bi bi-plus-lg"></i> Add Variant
          </button>
        </div>
      </div>
      <div class="inline-actions" style="margin-top:1rem">
        <button class="btn-primary compact" (click)="save()" [disabled]="saving()">
          {{ saving() ? 'Saving...' : isEdit() ? 'Update Product' : 'Create Product' }}
        </button>
        <button class="btn-secondary compact" (click)="cancel()">Cancel</button>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
})
export class ProductEditorComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private toast = inject(ToastService);

  isEdit = signal(false);
  saving = signal(false);
  brands = signal<Brand[]>([]);
  categories = signal<Category[]>([]);
  existingVariantIds: string[] = [];

  form = {
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    status: 'DRAFT',
    brandId: '',
    categoryIds: [] as string[],
    variants: [
      {
        sku: '',
        name: 'Default',
        price: '',
        compareAtPrice: '',
        currency: 'AUD',
        quantityOnHand: 0,
      },
    ] as any[],
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.isEdit.set(true);
      this.loadProduct(id);
    }
    this.loadBrands();
    this.loadCategories();
  }

  cancel() {
    this.router.navigate(['/products']);
  }

  private loadProduct(id: string) {
    this.http.get<any>(`${environment.apiUrl}/admin/products/${id}`).subscribe({
      next: (res) => {
        const p = res.data ?? res;
        this.form.name = p.name;
        this.form.slug = p.slug;
        this.form.description = p.description || '';
        this.form.shortDescription = p.shortDescription || '';
        this.form.status = p.status;
        this.form.brandId = p.brand?.id || '';
        this.form.categoryIds = p.categories?.map((c: any) => c.id) || [];
        this.form.variants =
          p.variants?.map((v: any) => ({
            id: v.id,
            sku: v.sku,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice || '',
            currency: v.currency || 'AUD',
            quantityOnHand: v.quantityOnHand ?? v.quantityAvailable ?? 0,
          })) || [];
        this.existingVariantIds = this.form.variants.map((v: any) => v.id).filter(Boolean);
      },
    });
  }

  private loadBrands() {
    this.http.get<any>(`${environment.apiUrl}/brands`).subscribe({
      next: (res) => this.brands.set(res.data ?? []),
    });
  }

  private loadCategories() {
    this.http.get<any>(`${environment.apiUrl}/categories`).subscribe({
      next: (res) => this.categories.set(res.data ?? []),
    });
  }

  toggleCategory(id: string) {
    const idx = this.form.categoryIds.indexOf(id);
    if (idx >= 0) this.form.categoryIds.splice(idx, 1);
    else this.form.categoryIds.push(id);
  }

  addVariant() {
    this.form.variants.push({
      sku: '',
      name: '',
      price: '',
      compareAtPrice: '',
      currency: 'AUD',
      quantityOnHand: 0,
    });
  }

  removeVariant(i: number) {
    this.form.variants.splice(i, 1);
  }

  save() {
    if (!this.form.name || this.form.variants.length === 0) {
      this.toast.warning('Validation', 'Name and at least one variant are required.');
      return;
    }
    this.saving.set(true);

    const id = this.route.snapshot.paramMap.get('id');
    const isEdit = id && id !== 'new';

    const body: any = {
      name: this.form.name,
      slug: this.form.slug || undefined,
      description: this.form.description || undefined,
      shortDescription: this.form.shortDescription || undefined,
      status: this.form.status,
      brandId: this.form.brandId || undefined,
      categoryIds: this.form.categoryIds.length ? this.form.categoryIds : undefined,
    };

    if (!isEdit) {
      body.variants = this.form.variants.map((v) => ({
        sku: v.sku,
        name: v.name,
        price: String(v.price),
        compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : undefined,
        currency: v.currency || 'AUD',
        quantityOnHand: v.quantityOnHand ?? 0,
      }));
    }

    const req = isEdit
      ? this.http.patch<any>(`${environment.apiUrl}/admin/products/${id}`, body)
      : this.http.post<any>(`${environment.apiUrl}/admin/products`, body);

    req.subscribe({
      next: (res) => {
        const productId = isEdit ? id! : res.data?.id;
        if (isEdit && productId) {
          this.syncVariants(productId);
        } else {
          this.toast.success('Saved', 'Product created successfully.');
          this.router.navigate(['/products']);
        }
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error('Error', err.error?.message || 'Failed to save product.');
      },
    });
  }

  private syncVariants(productId: string) {
    const currentVariants = this.form.variants.filter((v: any) => v.id);
    const newVariants = this.form.variants.filter((v: any) => !v.id);
    const currentIds = currentVariants.map((v: any) => v.id);
    const toDelete = this.existingVariantIds.filter((id) => !currentIds.includes(id));

    let pending = newVariants.length + toDelete.length;
    if (pending === 0) {
      this.toast.success('Saved', 'Product updated successfully.');
      this.router.navigate(['/products']);
      return;
    }

    const done = () => {
      pending--;
      if (pending <= 0) {
        this.toast.success('Saved', 'Product updated successfully.');
        this.router.navigate(['/products']);
      }
    };

    for (const v of newVariants) {
      this.http
        .post(`${environment.apiUrl}/admin/products/${productId}/variants`, {
          sku: v.sku,
          name: v.name,
          price: String(v.price),
          compareAtPrice: v.compareAtPrice ? String(v.compareAtPrice) : undefined,
          currency: v.currency || 'AUD',
          quantityOnHand: v.quantityOnHand ?? 0,
        })
        .subscribe({
          next: done,
          error: () => {
            this.saving.set(false);
            this.toast.error('Error', 'Failed to add variant.');
          },
        });
    }

    for (const vid of toDelete) {
      this.http
        .delete(`${environment.apiUrl}/admin/products/${productId}/variants/${vid}`)
        .subscribe({
          next: done,
          error: () => {
            this.saving.set(false);
            this.toast.error('Error', 'Failed to delete variant.');
          },
        });
    }
  }
}
