import { inject, Injectable } from '@angular/core';
import { ApiClient } from '../../core/http/api-client.service';
import { PaginatedData } from '../../core/http/api-response.model';
import { Brand, Category, Coupon, InventoryItem, Order, Product, ProductImage, ProductVariant, Review, ShippingMethod, User } from '../../core/models/commerce.models';

export interface AdminPreset {
  label: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  body?: unknown;
  permissions: string[];
}

export interface AdminMetric {
  label: string;
  value: string;
  status: 'available' | 'unavailable';
}

export type AdminResource = 'dashboard' | 'users' | 'products' | 'categories' | 'brands' | 'inventory' | 'orders' | 'refunds' | 'coupons' | 'shipping' | 'reviews';

export interface AdminResourceConfig {
  key: AdminResource;
  title: string;
  permissions: string[];
  endpoint: string;
  paginated: boolean;
  creatable: boolean;
  editable: boolean;
  deletable: boolean;
  sampleBody: unknown;
  fields: AdminField[];
}

export interface AdminField {
  key: string;
  label: string;
  type: 'text' | 'number' | 'money' | 'textarea' | 'select' | 'checkbox' | 'json';
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly api = inject(ApiClient);

  readonly presets: AdminPreset[] = [
    { label: 'Users', method: 'GET', path: '/admin/users?page=1&limit=20', permissions: ['user.read'] },
    { label: 'Products', method: 'GET', path: '/admin/products?page=1&limit=20', permissions: ['product.read'] },
    { label: 'Inventory', method: 'GET', path: '/admin/inventory?page=1&limit=20', permissions: ['inventory.read'] },
    { label: 'Orders', method: 'GET', path: '/admin/orders?page=1&limit=20', permissions: ['order.read'] },
    { label: 'Coupons', method: 'GET', path: '/admin/coupons?page=1&limit=20', permissions: ['discount.manage'] },
    { label: 'Shipping', method: 'GET', path: '/admin/shipping/methods', permissions: ['order.manage'] },
    { label: 'Reviews', method: 'GET', path: '/admin/reviews?page=1&limit=20', permissions: ['review.manage'] },
    {
      label: 'Create Coupon',
      method: 'POST',
      path: '/admin/coupons',
      permissions: ['discount.manage'],
      body: { code: 'SAVE15', type: 'PERCENTAGE', value: '15.00', isActive: true },
    },
  ];

  readonly resources: AdminResourceConfig[] = [
    {
      key: 'users',
      title: 'Users',
      permissions: ['user.read'],
      endpoint: '/admin/users',
      paginated: true,
      creatable: true,
      editable: true,
      deletable: false,
      sampleBody: {
        firstName: 'New',
        lastName: 'Customer',
        email: 'customer@example.com',
        phone: '',
        password: 'Strong-password-123',
        status: 'ACTIVE',
        emailVerified: false,
        roles: ['CUSTOMER'],
      },
      fields: [
        { key: 'firstName', label: 'First name', type: 'text', required: true },
        { key: 'lastName', label: 'Last name', type: 'text', required: true },
        { key: 'email', label: 'Email', type: 'text', required: true },
        { key: 'phone', label: 'Phone', type: 'text', placeholder: '+61400000000' },
        { key: 'password', label: 'Initial password', type: 'text', required: true },
        { key: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'INACTIVE', 'SUSPENDED'], required: true },
        { key: 'roles', label: 'Roles', type: 'json', placeholder: '["CUSTOMER"]' },
        { key: 'emailVerified', label: 'Email verified', type: 'checkbox' },
      ],
    },
    {
      key: 'products',
      title: 'Products',
      permissions: ['product.read'],
      endpoint: '/admin/products',
      paginated: true,
      creatable: true,
      editable: true,
      deletable: true,
      sampleBody: { name: 'New Product', shortDescription: 'Short product summary', description: 'Detailed product description', status: 'ACTIVE', variants: [{ sku: 'SKU-001', name: 'Default', price: '100.00', currency: 'AUD', quantityOnHand: 10, isActive: true }] },
      fields: [
        { key: 'name', label: 'Product name', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text' },
        { key: 'shortDescription', label: 'Short description', type: 'textarea' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'brandId', label: 'Brand', type: 'text' },
        { key: 'categoryIds', label: 'Categories', type: 'text' },
        { key: 'status', label: 'Status', type: 'select', options: ['DRAFT', 'ACTIVE', 'ARCHIVED'], required: true },
        { key: 'images', label: 'Images', type: 'text' },
        { key: 'variants', label: 'Variants', type: 'text', required: true },
      ],
    },
    {
      key: 'categories',
      title: 'Categories',
      permissions: ['category.manage'],
      endpoint: '/admin/categories',
      paginated: false,
      creatable: true,
      editable: true,
      deletable: true,
      sampleBody: { name: 'New Category', isActive: true, sortOrder: 50 },
      fields: [
        { key: 'name', label: 'Category name', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'parentId', label: 'Parent category ID', type: 'text' },
        { key: 'imageUrl', label: 'Image URL', type: 'text' },
        { key: 'sortOrder', label: 'Sort order', type: 'number' },
        { key: 'isActive', label: 'Active', type: 'checkbox' },
      ],
    },
    {
      key: 'brands',
      title: 'Brands',
      permissions: ['brand.manage'],
      endpoint: '/admin/brands',
      paginated: false,
      creatable: true,
      editable: true,
      deletable: true,
      sampleBody: { name: 'New Brand', isActive: true },
      fields: [
        { key: 'name', label: 'Brand name', type: 'text', required: true },
        { key: 'slug', label: 'Slug', type: 'text' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'logoUrl', label: 'Logo URL', type: 'text' },
        { key: 'websiteUrl', label: 'Website URL', type: 'text' },
        { key: 'isActive', label: 'Active', type: 'checkbox' },
      ],
    },
    {
      key: 'inventory',
      title: 'Inventory',
      permissions: ['inventory.read'],
      endpoint: '/admin/inventory',
      paginated: true,
      creatable: false,
      editable: true,
      deletable: false,
      sampleBody: { quantityDelta: 5, note: 'Cycle count adjustment' },
      fields: [
        { key: 'quantityDelta', label: 'Quantity delta', type: 'number', required: true },
        { key: 'note', label: 'Note', type: 'textarea' },
      ],
    },
    {
      key: 'orders',
      title: 'Orders',
      permissions: ['order.read'],
      endpoint: '/admin/orders',
      paginated: true,
      creatable: false,
      editable: true,
      deletable: false,
      sampleBody: { status: 'PROCESSING', note: 'Admin status update' },
      fields: [
        { key: 'status', label: 'Status', type: 'select', options: ['PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUND_PENDING', 'PARTIALLY_REFUNDED', 'REFUNDED'], required: true },
        { key: 'note', label: 'Note', type: 'textarea' },
      ],
    },
    {
      key: 'coupons',
      title: 'Coupons',
      permissions: ['discount.manage'],
      endpoint: '/admin/coupons',
      paginated: false,
      creatable: true,
      editable: true,
      deletable: true,
      sampleBody: { code: 'SAVE15', type: 'PERCENTAGE', value: '15.00', isActive: true },
      fields: [
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'type', label: 'Type', type: 'select', options: ['PERCENTAGE', 'FIXED_AMOUNT'], required: true },
        { key: 'value', label: 'Value', type: 'money', required: true },
        { key: 'minimumOrderAmount', label: 'Minimum order', type: 'money' },
        { key: 'maximumDiscountAmount', label: 'Maximum discount', type: 'money' },
        { key: 'usageLimit', label: 'Usage limit', type: 'number' },
        { key: 'usageLimitPerUser', label: 'Usage per user', type: 'number' },
        { key: 'isActive', label: 'Active', type: 'checkbox' },
      ],
    },
    {
      key: 'shipping',
      title: 'Shipping',
      permissions: ['order.manage'],
      endpoint: '/admin/shipping/methods',
      paginated: false,
      creatable: true,
      editable: true,
      deletable: true,
      sampleBody: { name: 'Priority Shipping', code: 'PRIORITY', description: 'Fast tracked delivery', price: '18.00', currency: 'AUD', estimatedMinDays: 1, estimatedMaxDays: 3, isActive: true },
      fields: [
        { key: 'name', label: 'Method name', type: 'text', required: true },
        { key: 'code', label: 'Code', type: 'text', required: true },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'price', label: 'Price', type: 'money', required: true },
        { key: 'currency', label: 'Currency', type: 'text' },
        { key: 'estimatedMinDays', label: 'Min days', type: 'number', required: true },
        { key: 'estimatedMaxDays', label: 'Max days', type: 'number', required: true },
        { key: 'isActive', label: 'Active', type: 'checkbox' },
      ],
    },
    {
      key: 'reviews',
      title: 'Reviews',
      permissions: ['review.manage'],
      endpoint: '/admin/reviews',
      paginated: true,
      creatable: false,
      editable: true,
      deletable: true,
      sampleBody: { status: 'APPROVED' },
      fields: [{ key: 'status', label: 'Moderation status', type: 'select', options: ['PENDING', 'APPROVED', 'REJECTED'], required: true }],
    },
    {
      key: 'refunds',
      title: 'Refunds',
      permissions: ['order.refund'],
      endpoint: '/admin/orders/:orderId/refunds',
      paginated: false,
      creatable: true,
      editable: false,
      deletable: false,
      sampleBody: { amount: '10.00', reason: 'Customer service refund' },
      fields: [
        { key: 'amount', label: 'Refund amount', type: 'money', required: true },
        { key: 'reason', label: 'Reason', type: 'textarea', required: true },
      ],
    },
  ];

  metrics(): AdminMetric[] {
    return [
      { label: 'Revenue', value: 'Backend endpoint needed', status: 'unavailable' },
      { label: 'Orders', value: 'Use admin orders list', status: 'available' },
      { label: 'Customers', value: 'Use admin users list', status: 'available' },
      { label: 'Low Stock', value: 'Use inventory filters', status: 'available' },
      { label: 'Pending Reviews', value: 'Use admin reviews list', status: 'available' },
      { label: 'Pending Refunds', value: 'Backend endpoint needed', status: 'unavailable' },
    ];
  }

  run<T>(method: AdminPreset['method'], path: string, body?: unknown): Promise<T | PaginatedData<T[]>> {
    if (method === 'GET') return this.api.get<T | PaginatedData<T[]>>(path);
    if (method === 'POST') return this.api.post<T>(path, body);
    if (method === 'PATCH') return this.api.patch<T>(path, body);
    return this.api.delete<T>(path);
  }

  list(resource: AdminResourceConfig, page = 1): Promise<unknown> {
    if (resource.key === 'categories') return this.api.get<Category[]>('/categories');
    if (resource.key === 'brands') return this.api.get<Brand[]>('/brands');
    if (resource.key === 'coupons') return this.api.get<Coupon[]>('/admin/coupons');
    if (resource.key === 'shipping') return this.api.get<ShippingMethod[]>('/admin/shipping/methods');
    if (resource.key === 'products') return this.api.getPage<Product>('/admin/products', { page, limit: 20 });
    if (resource.key === 'users') return this.api.getPage<User>('/admin/users', { page, limit: 20 });
    if (resource.key === 'inventory') return this.api.getPage<InventoryItem>('/admin/inventory', { page, limit: 20 });
    if (resource.key === 'orders') return this.api.getPage<Order>('/admin/orders', { page, limit: 20 });
    if (resource.key === 'reviews') return this.api.getPage<Review>('/admin/reviews', { page, limit: 20 });
    return Promise.resolve([]);
  }

  create(resource: AdminResourceConfig, body: unknown, pathOverride?: string): Promise<unknown> {
    return this.api.post(pathOverride ?? resource.endpoint, body);
  }

  update(resource: AdminResourceConfig, id: string, body: unknown): Promise<unknown> {
    if (resource.key === 'users') return this.api.patch(`${resource.endpoint}/${id}`, body);
    if (resource.key === 'orders') return this.api.patch(`${resource.endpoint}/${id}/status`, body);
    if (resource.key === 'reviews') return this.api.patch(`${resource.endpoint}/${id}/status`, body);
    if (resource.key === 'inventory') return this.api.post(`${resource.endpoint}/${id}/adjustments`, body);
    return this.api.patch(`${resource.endpoint}/${id}`, body);
  }

  delete(resource: AdminResourceConfig, id: string): Promise<unknown> {
    return this.api.delete(`${resource.endpoint}/${id}`);
  }

  listBrands(): Promise<Brand[]> {
    return this.api.get<Brand[]>('/brands');
  }

  listCategories(): Promise<Category[]> {
    return this.api.get<Category[]>('/categories');
  }

  createProduct(body: unknown): Promise<Product> {
    return this.api.post<Product>('/admin/products', body);
  }

  updateProduct(id: string, body: unknown): Promise<Product> {
    return this.api.patch<Product>(`/admin/products/${id}`, body);
  }

  addProductImage(productId: string, body: unknown): Promise<ProductImage> {
    return this.api.post<ProductImage>(`/admin/products/${productId}/images`, body);
  }

  updateProductImage(productId: string, imageId: string, body: unknown): Promise<ProductImage> {
    return this.api.patch<ProductImage>(`/admin/products/${productId}/images/${imageId}`, body);
  }

  deleteProductImage(productId: string, imageId: string): Promise<unknown> {
    return this.api.delete(`/admin/products/${productId}/images/${imageId}`);
  }

  addProductVariant(productId: string, body: unknown): Promise<ProductVariant> {
    return this.api.post<ProductVariant>(`/admin/products/${productId}/variants`, body);
  }

  updateProductVariant(productId: string, variantId: string, body: unknown): Promise<ProductVariant> {
    return this.api.patch<ProductVariant>(`/admin/products/${productId}/variants/${variantId}`, body);
  }

  deleteProductVariant(productId: string, variantId: string): Promise<unknown> {
    return this.api.delete(`/admin/products/${productId}/variants/${variantId}`);
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;
