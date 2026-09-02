'use client';

import { apiClient } from '@/lib/auth/api-client';
import type {
  ApiResponse,
  CreateProductImageInput,
  CreateProductInput,
  CreateProductVariantInput,
  Product,
  ProductImage,
  ProductRelation,
  ProductQuery,
  ProductVariant,
  UpdateProductImageInput,
  UpdateProductInput,
  UpdateProductVariantInput,
} from '../types/product.types';

const BASE = '/api/v1/admin/products';

function toParams(query: ProductQuery) {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });

  return params;
}

export const productsApi = {
  async listBrands() {
    const { data } = await apiClient.get<ApiResponse<ProductRelation[]>>('/api/v1/brands');
    return data;
  },

  async listCategories() {
    const { data } = await apiClient.get<ApiResponse<ProductRelation[]>>('/api/v1/categories');
    return data;
  },

  async list(query: ProductQuery) {
    const { data } = await apiClient.get<ApiResponse<Product[]>>(BASE, { params: toParams(query) });
    return data;
  },

  async get(id: string) {
    const { data } = await apiClient.get<ApiResponse<Product>>(`${BASE}/${id}`);
    return data;
  },

  async create(payload: CreateProductInput) {
    const { data } = await apiClient.post<ApiResponse<Product>>(BASE, payload);
    return data;
  },

  async update(id: string, payload: UpdateProductInput) {
    const { data } = await apiClient.patch<ApiResponse<Product>>(`${BASE}/${id}`, payload);
    return data;
  },

  async remove(id: string) {
    const { data } = await apiClient.delete<ApiResponse<unknown>>(`${BASE}/${id}`);
    return data;
  },

  async addImage(productId: string, payload: CreateProductImageInput) {
    const { data } = await apiClient.post<ApiResponse<ProductImage>>(`${BASE}/${productId}/images`, payload);
    return data;
  },

  async updateImage(productId: string, imageId: string, payload: UpdateProductImageInput) {
    const { data } = await apiClient.patch<ApiResponse<ProductImage>>(`${BASE}/${productId}/images/${imageId}`, payload);
    return data;
  },

  async deleteImage(productId: string, imageId: string) {
    const { data } = await apiClient.delete<ApiResponse<unknown>>(`${BASE}/${productId}/images/${imageId}`);
    return data;
  },

  async addVariant(productId: string, payload: CreateProductVariantInput) {
    const { data } = await apiClient.post<ApiResponse<ProductVariant>>(`${BASE}/${productId}/variants`, payload);
    return data;
  },

  async updateVariant(productId: string, variantId: string, payload: UpdateProductVariantInput) {
    const { data } = await apiClient.patch<ApiResponse<ProductVariant>>(`${BASE}/${productId}/variants/${variantId}`, payload);
    return data;
  },

  async deleteVariant(productId: string, variantId: string) {
    const { data } = await apiClient.delete<ApiResponse<unknown>>(`${BASE}/${productId}/variants/${variantId}`);
    return data;
  },
};
