import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { AdminFormValue, AdminProductForm, AdminUserForm } from '../admin-resource.models';
import { AdminResourceConfig } from '../admin.service';
import { Brand, Category } from '../../../core/models/commerce.models';

@Component({
  selector: 'app-admin-resource-editor',
  standalone: true,
  imports: [FormsModule],
  template: `
    <aside class="surface admin-editor">
      <div class="section-heading compact">
        <div>
          <p class="eyebrow">{{ editId ? 'Edit' : 'Create' }}</p>
          <h2>{{ editId ? singular(resource.title) + ' details' : singular(resource.title) + ' form' }}</h2>
        </div>
        @if (editId) {
          <span class="status">#{{ editId.slice(0, 8) }}</span>
        }
      </div>

      @if (!resource.creatable && !resource.editable) {
        <p class="muted">This resource is read-only in the current backend contract.</p>
      } @else if (resource.key === 'users') {
        <form class="user-editor-form" #userEditor="ngForm" (ngSubmit)="submitIfValid(userEditor)" novalidate>
          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-person-vcard"></i>
              <div>
                <strong>Identity</strong>
                <span>Customer profile information.</span>
              </div>
            </div>
            <div class="resource-form">
              <label>
                First name
                <input
                  #firstName="ngModel"
                  [(ngModel)]="userForm.firstName"
                  name="firstName"
                  required
                  autocomplete="given-name"
                  [class.invalid-field]="showInvalid(firstName, userEditor)"
                />
                @if (showInvalid(firstName, userEditor)) {
                  <small class="field-error">First name is required.</small>
                }
              </label>
              <label>
                Last name
                <input
                  #lastName="ngModel"
                  [(ngModel)]="userForm.lastName"
                  name="lastName"
                  required
                  autocomplete="family-name"
                  [class.invalid-field]="showInvalid(lastName, userEditor)"
                />
                @if (showInvalid(lastName, userEditor)) {
                  <small class="field-error">Last name is required.</small>
                }
              </label>
              <label class="span-2">
                Email
                <input
                  #email="ngModel"
                  [(ngModel)]="userForm.email"
                  name="email"
                  type="email"
                  required
                  email
                  autocomplete="email"
                  [class.invalid-field]="showInvalid(email, userEditor)"
                />
                @if (showInvalid(email, userEditor)) {
                  <small class="field-error">Enter a valid email address.</small>
                }
              </label>
              <label class="span-2">
                Phone
                <input
                  #phone="ngModel"
                  [(ngModel)]="userForm.phone"
                  name="phone"
                  pattern="^\\+[1-9]\\d{7,14}$"
                  placeholder="+61400000000"
                  autocomplete="tel"
                  [class.invalid-field]="showInvalid(phone, userEditor)"
                />
                <small>Use an international phone format when possible.</small>
                @if (showInvalid(phone, userEditor)) {
                  <small class="field-error">Phone must be a valid phone number.</small>
                }
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-shield-check"></i>
              <div>
                <strong>Access</strong>
                <span>Status and roles are validated by the backend.</span>
              </div>
            </div>
              <label>
                Status
                <select #status="ngModel" [(ngModel)]="userForm.status" name="status" required [class.invalid-field]="showInvalid(status, userEditor)">
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                  <option value="SUSPENDED">Suspended</option>
                </select>
                @if (showInvalid(status, userEditor)) {
                  <small class="field-error">Status is required.</small>
                }
              </label>
            <div class="role-picker" role="group" aria-label="User roles">
              @for (role of availableRoles; track role) {
                <label class="role-option" [class.selected]="hasUserRole(role)">
                  <input type="checkbox" [checked]="hasUserRole(role)" (change)="toggleUserRole(role)" />
                  <span>{{ roleLabel(role) }}</span>
                </label>
              }
            </div>
            <label class="check-row verification-row">
              <input type="checkbox" [(ngModel)]="userForm.emailVerified" name="emailVerified" />
              Mark email as verified
            </label>
          </section>

          @if (!editId) {
            <section class="form-section">
              <div class="form-section-heading">
                <i class="bi bi-key"></i>
                <div>
                  <strong>Initial password</strong>
                  <span>Minimum 12 characters with uppercase, lowercase, and a number.</span>
                </div>
              </div>
              <label>
                Password
                <span class="password-field">
                  <input
                    #password="ngModel"
                    [(ngModel)]="userForm.password"
                    name="password"
                    [type]="passwordVisible ? 'text' : 'password'"
                    required
                    minlength="12"
                    autocomplete="new-password"
                    [class.invalid-field]="showInvalid(password, userEditor)"
                  />
                  <button class="password-toggle" type="button" [attr.aria-label]="passwordVisible ? 'Hide password' : 'Show password'" (click)="passwordVisible = !passwordVisible">
                    <i [class]="passwordVisible ? 'bi bi-eye-slash' : 'bi bi-eye'"></i>
                  </button>
                </span>
                @if (showInvalid(password, userEditor)) {
                  <small class="field-error">Password must be longer than or equal to 12 characters.</small>
                }
              </label>
            </section>
          }

          <div class="inline-actions">
            <button class="btn-primary" type="submit">
              <i [class]="editId ? 'bi bi-check2' : 'bi bi-person-plus'"></i>
              {{ editId ? 'Save user' : 'Create user' }}
            </button>
            <button class="btn-secondary" type="button" (click)="reset.emit()">Reset</button>
          </div>
        </form>
      } @else if (resource.key === 'products') {
        <form class="product-editor-form" #productEditor="ngForm" (ngSubmit)="submitIfValid(productEditor)" novalidate>
          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-card-text"></i>
              <div>
                <strong>Product details</strong>
                <span>Core merchandising content shown in catalog and product detail pages.</span>
              </div>
            </div>
            <div class="resource-form">
              <label>
                Product name
                <input #productName="ngModel" [(ngModel)]="productForm.name" name="productName" required [class.invalid-field]="showInvalid(productName, productEditor)" />
                @if (showInvalid(productName, productEditor)) {
                  <small class="field-error">Product name is required.</small>
                }
              </label>
              <label>
                Slug
                <input [(ngModel)]="productForm.slug" name="productSlug" placeholder="auto-generated-from-name" />
              </label>
              <label>
                Status
                <select [(ngModel)]="productForm.status" name="productStatus" required>
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </label>
              <label>
                Brand
                <select [(ngModel)]="productForm.brandId" name="brandId">
                  <option value="">No brand</option>
                  @for (brand of brands; track brand.id) {
                    <option [value]="brand.id">{{ brand.name }}</option>
                  }
                </select>
              </label>
              <label class="span-2">
                Short description
                <textarea [(ngModel)]="productForm.shortDescription" name="shortDescription" maxlength="500"></textarea>
              </label>
              <label class="span-2">
                Full description
                <textarea [(ngModel)]="productForm.description" name="description"></textarea>
              </label>
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-diagram-3"></i>
              <div>
                <strong>Categories</strong>
                <span>Select where this product appears in the catalog.</span>
              </div>
            </div>
            <div class="category-picker">
              @for (category of categories; track category.id) {
                <label class="category-option" [class.selected]="hasProductCategory(category.id)">
                  <input type="checkbox" [checked]="hasProductCategory(category.id)" (change)="toggleProductCategory(category.id)" />
                  <span>{{ category.name }}</span>
                </label>
              }
            </div>
          </section>

          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-images"></i>
              <div>
                <strong>Images</strong>
                <span>Add customer-facing image URLs and choose the primary image.</span>
              </div>
            </div>
            <div class="image-editor-list">
              @for (image of productForm.images; track $index; let imageIndex = $index) {
                <article class="image-editor-card">
                  <div class="image-preview">
                    @if (image.url) {
                      <img [src]="image.url" [alt]="image.altText || productForm.name || 'Product image'" />
                    } @else {
                      <i class="bi bi-image"></i>
                    }
                  </div>
                  <div class="resource-form">
                    <label class="span-2">
                      Image URL
                      <input #imageUrl="ngModel" [(ngModel)]="image.url" [name]="'imageUrl' + imageIndex" [required]="imageIndex === 0" [class.invalid-field]="showInvalid(imageUrl, productEditor)" />
                      @if (showInvalid(imageUrl, productEditor)) {
                        <small class="field-error">At least one image URL is required.</small>
                      }
                    </label>
                    <label>
                      Alt text
                      <input [(ngModel)]="image.altText" [name]="'imageAlt' + imageIndex" />
                    </label>
                    <label>
                      Sort order
                      <input type="number" [(ngModel)]="image.sortOrder" [name]="'imageSort' + imageIndex" />
                    </label>
                    <label class="check-row">
                      <input type="checkbox" [checked]="image.isPrimary" (change)="setPrimaryImage(imageIndex)" />
                      Primary image
                    </label>
                  </div>
                  <button class="icon-btn danger" type="button" aria-label="Remove image" (click)="removeImage(imageIndex)">
                    <i class="bi bi-trash"></i>
                  </button>
                </article>
              }
            </div>
            <button class="btn-secondary compact" type="button" (click)="addImage()"><i class="bi bi-plus-lg"></i> Add image</button>
          </section>

          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-upc-scan"></i>
              <div>
                <strong>Variants</strong>
                <span>Define SKU, price, options, and initial stock.</span>
              </div>
            </div>
            <div class="variant-editor-list">
              @for (variant of productForm.variants; track $index; let variantIndex = $index) {
                <article class="variant-editor-card">
                  <div class="variant-card-heading">
                    <strong>{{ variant.name || 'Variant ' + (variantIndex + 1) }}</strong>
                    <button class="icon-btn danger" type="button" aria-label="Remove variant" (click)="removeVariant(variantIndex)">
                      <i class="bi bi-trash"></i>
                    </button>
                  </div>
                  <div class="resource-form">
                    <label>
                      SKU
                      <input #sku="ngModel" [(ngModel)]="variant.sku" [name]="'variantSku' + variantIndex" required [class.invalid-field]="showInvalid(sku, productEditor)" />
                      @if (showInvalid(sku, productEditor)) {
                        <small class="field-error">SKU is required.</small>
                      }
                    </label>
                    <label>
                      Variant name
                      <input #variantName="ngModel" [(ngModel)]="variant.name" [name]="'variantName' + variantIndex" required [class.invalid-field]="showInvalid(variantName, productEditor)" />
                    </label>
                    <label>
                      Price
                      <input #price="ngModel" inputmode="decimal" pattern="^\\d+(\\.\\d{1,2})?$" [(ngModel)]="variant.price" [name]="'variantPrice' + variantIndex" required [class.invalid-field]="showInvalid(price, productEditor)" />
                      @if (showInvalid(price, productEditor)) {
                        <small class="field-error">Use a valid amount, for example 100.00.</small>
                      }
                    </label>
                    <label>
                      Currency
                      <select [(ngModel)]="variant.currency" [name]="'variantCurrency' + variantIndex">
                        <option value="AUD">AUD</option>
                        <option value="USD">USD</option>
                        <option value="GBP">GBP</option>
                        <option value="NPR">NPR</option>
                      </select>
                    </label>
                    <label>
                      Compare price
                      <input inputmode="decimal" pattern="^\\d+(\\.\\d{1,2})?$" [(ngModel)]="variant.compareAtPrice" [name]="'variantCompare' + variantIndex" placeholder="Optional" />
                    </label>
                    <label>
                      Cost price
                      <input inputmode="decimal" pattern="^\\d+(\\.\\d{1,2})?$" [(ngModel)]="variant.costPrice" [name]="'variantCost' + variantIndex" placeholder="Optional" />
                    </label>
                    <label>
                      Stock on hand
                      <input type="number" min="0" [(ngModel)]="variant.quantityOnHand" [name]="'variantStock' + variantIndex" />
                    </label>
                    <label>
                      Barcode
                      <input [(ngModel)]="variant.barcode" [name]="'variantBarcode' + variantIndex" />
                    </label>
                    <label>
                      Option name
                      <input [(ngModel)]="variant.optionName" [name]="'variantOptionName' + variantIndex" placeholder="Color" />
                    </label>
                    <label>
                      Option value
                      <input [(ngModel)]="variant.optionValue" [name]="'variantOptionValue' + variantIndex" placeholder="Black" />
                    </label>
                    <label>
                      Weight
                      <input inputmode="decimal" pattern="^\\d+(\\.\\d{1,3})?$" [(ngModel)]="variant.weight" [name]="'variantWeight' + variantIndex" placeholder="Optional" />
                    </label>
                    <label class="check-row">
                      <input type="checkbox" [(ngModel)]="variant.isActive" [name]="'variantActive' + variantIndex" />
                      Active variant
                    </label>
                  </div>
                </article>
              }
            </div>
            <button class="btn-secondary compact" type="button" (click)="addVariant()"><i class="bi bi-plus-lg"></i> Add variant</button>
          </section>

          <section class="form-section">
            <div class="form-section-heading">
              <i class="bi bi-search"></i>
              <div>
                <strong>SEO</strong>
                <span>Optional search metadata for future storefront pages.</span>
              </div>
            </div>
            <div class="resource-form">
              <label>
                SEO title
                <input [(ngModel)]="productForm.seoTitle" name="seoTitle" maxlength="255" />
              </label>
              <label>
                SEO description
                <input [(ngModel)]="productForm.seoDescription" name="seoDescription" maxlength="500" />
              </label>
            </div>
          </section>

          <div class="inline-actions">
            <button class="btn-primary" type="submit">
              <i [class]="editId ? 'bi bi-check2' : 'bi bi-plus-lg'"></i>
              {{ editId ? 'Save product' : 'Create product' }}
            </button>
            <button class="btn-secondary" type="button" (click)="reset.emit()">Reset</button>
          </div>
        </form>
      } @else {
        @if (resource.key === 'refunds') {
          <label>
            Order ID
            <input [ngModel]="refundOrderId" (ngModelChange)="refundOrderIdChange.emit($event)" name="refundOrderId" placeholder="Order UUID" />
          </label>
        }

        <form class="user-editor-form" #resourceEditor="ngForm" (ngSubmit)="submitIfValid(resourceEditor)" novalidate>
          <section class="form-section">
            <div class="form-section-heading">
              <i [class]="sectionIcon(resource.key)"></i>
              <div>
                <strong>{{ singular(resource.title) }} details</strong>
                <span>{{ sectionHelp(resource.key) }}</span>
              </div>
            </div>
            <div class="resource-form">
              @for (field of resource.fields; track field.key) {
                @switch (field.type) {
                  @case ('textarea') {
                    <label class="span-2">
                      {{ field.label }}
                      <textarea
                        #textareaField="ngModel"
                        [(ngModel)]="form[field.key]"
                        [name]="field.key"
                        [required]="field.required ?? false"
                        [placeholder]="field.placeholder || ''"
                        [class.invalid-field]="showInvalid(textareaField, resourceEditor)"
                      ></textarea>
                      @if (showInvalid(textareaField, resourceEditor)) {
                        <small class="field-error">{{ field.label }} is required.</small>
                      }
                    </label>
                  }
                  @case ('select') {
                    <label>
                      {{ field.label }}
                      <select
                        #selectField="ngModel"
                        [(ngModel)]="form[field.key]"
                        [name]="field.key"
                        [required]="field.required ?? false"
                        [class.invalid-field]="showInvalid(selectField, resourceEditor)"
                      >
                        @for (option of field.options ?? []; track option) {
                          <option [value]="option">{{ option }}</option>
                        }
                      </select>
                      @if (showInvalid(selectField, resourceEditor)) {
                        <small class="field-error">{{ field.label }} is required.</small>
                      }
                    </label>
                  }
                  @case ('checkbox') {
                    <label class="check-row">
                      <input type="checkbox" [(ngModel)]="form[field.key]" [name]="field.key" />
                      {{ field.label }}
                    </label>
                  }
                  @case ('json') {
                    <label class="span-2">
                      {{ field.label }}
                      <textarea
                        #jsonField="ngModel"
                        class="code-field"
                        [(ngModel)]="form[field.key]"
                        [name]="field.key"
                        [required]="field.required ?? false"
                        [placeholder]="field.placeholder || ''"
                        [class.invalid-field]="showInvalid(jsonField, resourceEditor)"
                      ></textarea>
                      <small>{{ helperText(field.key) }}</small>
                      @if (showInvalid(jsonField, resourceEditor)) {
                        <small class="field-error">{{ field.label }} is required.</small>
                      }
                    </label>
                  }
                  @case ('number') {
                    <label>
                      {{ field.label }}
                      <input
                        #numberField="ngModel"
                        type="number"
                        [(ngModel)]="form[field.key]"
                        [name]="field.key"
                        [required]="field.required ?? false"
                        [placeholder]="field.placeholder || ''"
                        [class.invalid-field]="showInvalid(numberField, resourceEditor)"
                      />
                      @if (showInvalid(numberField, resourceEditor)) {
                        <small class="field-error">{{ field.label }} is required.</small>
                      }
                    </label>
                  }
                  @case ('money') {
                    <label>
                      {{ field.label }}
                      <input
                        #moneyField="ngModel"
                        inputmode="decimal"
                        pattern="^\\d+(\\.\\d{1,2})?$"
                        [(ngModel)]="form[field.key]"
                        [name]="field.key"
                        [required]="field.required ?? false"
                        [placeholder]="field.placeholder || '0.00'"
                        [class.invalid-field]="showInvalid(moneyField, resourceEditor)"
                      />
                      @if (showInvalid(moneyField, resourceEditor)) {
                        <small class="field-error">Enter a valid amount, for example 10.00.</small>
                      }
                    </label>
                  }
                  @default {
                    <label>
                      {{ field.label }}
                      <input
                        #textField="ngModel"
                        [(ngModel)]="form[field.key]"
                        [name]="field.key"
                        [required]="field.required ?? false"
                        [placeholder]="field.placeholder || ''"
                        [class.invalid-field]="showInvalid(textField, resourceEditor)"
                      />
                      @if (showInvalid(textField, resourceEditor)) {
                        <small class="field-error">{{ field.label }} is required.</small>
                      }
                    </label>
                  }
                }
              }
            </div>
          </section>
          <div class="inline-actions">
            <button class="btn-primary" type="submit">
              <i [class]="editId ? 'bi bi-check2' : 'bi bi-plus-lg'"></i>
              {{ submitLabel(resource) }}
            </button>
            <button class="btn-secondary" type="button" (click)="reset.emit()">Reset</button>
          </div>
        </form>
      }

      <details class="response-details">
        <summary>Technical response</summary>
        <pre>{{ responseText() }}</pre>
      </details>
    </aside>
  `,
})
export class AdminResourceEditorComponent {
  @Input({ required: true }) resource!: AdminResourceConfig;
  @Input() editId = '';
  @Input() response: unknown = null;
  @Input() form: Record<string, AdminFormValue> = {};
  @Input() productForm: AdminProductForm = this.emptyProductForm();
  @Input() brands: Brand[] = [];
  @Input() categories: Category[] = [];
  @Input() userForm: AdminUserForm = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    status: 'ACTIVE',
    emailVerified: false,
    roles: [],
  };
  @Input() refundOrderId = '';
  @Input() availableRoles: string[] = [];
  @Output() refundOrderIdChange = new EventEmitter<string>();
  @Output() submit = new EventEmitter<void>();
  @Output() reset = new EventEmitter<void>();
  @Output() removeProductImage = new EventEmitter<number>();
  @Output() removeProductVariant = new EventEmitter<number>();
  passwordVisible = false;

  submitIfValid(form: NgForm): void {
    if (form.invalid) {
      form.form.markAllAsTouched();
      return;
    }
    this.submit.emit();
  }

  showInvalid(control: { invalid: boolean | null; touched: boolean | null }, form: NgForm): boolean {
    return Boolean(control.invalid && (control.touched || form.submitted));
  }

  hasUserRole(role: string): boolean {
    return this.userForm.roles.includes(role);
  }

  toggleUserRole(role: string): void {
    this.userForm.roles = this.hasUserRole(role) ? this.userForm.roles.filter((item) => item !== role) : [...this.userForm.roles, role];
  }

  roleLabel(role: string): string {
    return role.replace('_', ' ');
  }

  hasProductCategory(categoryId: string): boolean {
    return this.productForm.categoryIds.includes(categoryId);
  }

  toggleProductCategory(categoryId: string): void {
    this.productForm.categoryIds = this.hasProductCategory(categoryId)
      ? this.productForm.categoryIds.filter((id) => id !== categoryId)
      : [...this.productForm.categoryIds, categoryId];
  }

  addImage(): void {
    this.productForm.images = [...this.productForm.images, { url: '', altText: '', sortOrder: this.productForm.images.length, isPrimary: this.productForm.images.length === 0 }];
  }

  removeImage(index: number): void {
    this.removeProductImage.emit(index);
  }

  setPrimaryImage(index: number): void {
    this.productForm.images = this.productForm.images.map((image, currentIndex) => ({
      ...image,
      isPrimary: currentIndex === index,
    }));
  }

  addVariant(): void {
    this.productForm.variants = [...this.productForm.variants, this.emptyVariant()];
  }

  removeVariant(index: number): void {
    this.removeProductVariant.emit(index);
  }

  submitLabel(resource: AdminResourceConfig): string {
    if (resource.key === 'inventory') return 'Adjust inventory';
    if (resource.key === 'refunds') return 'Create refund';
    return this.editId ? 'Save changes' : `Create ${this.singular(resource.title)}`;
  }

  singular(title: string): string {
    if (title === 'Categories') return 'Category';
    if (title.endsWith('ies')) return `${title.slice(0, -3)}y`;
    if (title.endsWith('s')) return title.slice(0, -1);
    return title;
  }

  helperText(key: string): string {
    const helpers: Record<string, string> = {
      categoryIds: 'Choose one or more storefront categories.',
      images: 'Add image URLs, alt text, sort order, and the primary image flag.',
      variants: 'Add sellable SKUs with prices, options, currency, and stock.',
      roles: 'Select roles using the role controls where available.',
    };
    return helpers[key] ?? 'Structured data is sent directly to the backend.';
  }

  sectionIcon(key: string): string {
    const icons: Record<string, string> = {
      products: 'bi bi-box-seam',
      categories: 'bi bi-diagram-3',
      brands: 'bi bi-award',
      inventory: 'bi bi-boxes',
      orders: 'bi bi-receipt',
      refunds: 'bi bi-arrow-counterclockwise',
      coupons: 'bi bi-ticket-perforated',
      shipping: 'bi bi-truck',
      reviews: 'bi bi-star',
    };
    return icons[key] ?? 'bi bi-pencil-square';
  }

  sectionHelp(key: string): string {
    const helpers: Record<string, string> = {
      products: 'Enter merchandising content, choose categories, add images, and define sellable variants.',
      categories: 'Control where the category appears and whether customers can browse it.',
      brands: 'Keep brand identity and storefront links consistent.',
      inventory: 'Use positive or negative adjustments with a clear audit note.',
      orders: 'Move orders through the backend-supported status workflow.',
      refunds: 'Create a refund request tied to an existing order.',
      coupons: 'Define the discount, usage limits, and whether the code is active.',
      shipping: 'Set customer-facing delivery name, price, and estimate range.',
      reviews: 'Choose the moderation result for this customer review.',
    };
    return helpers[key] ?? 'Complete the fields required by the backend.';
  }

  responseText(): string {
    return this.response ? JSON.stringify(this.response, null, 2) : 'No response yet.';
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
      variants: [this.emptyVariant()],
    };
  }

  private emptyVariant() {
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
}
