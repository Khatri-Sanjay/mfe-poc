'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '../api/products.api';
import type { CreateProductInput } from '../types/product.types';
import { ProductForm } from './product-form';

export function ProductCreateScreen() {
  const router = useRouter();

  async function create(payload: CreateProductInput) {
    try {
      const response = await productsApi.create(payload);
      router.replace(`/admin/products/${response.data.id}/edit?tab=images`);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Unable to create product.'));
    }
  }

  return (
    <main className="page stack">
      <header className="page-header">
        <div><Link className="link muted" href="/admin/products">← Products</Link><h1 className="page-title" style={{ marginTop: 10 }}>Create Product</h1><p className="page-subtitle">Create the base product, then add its images and variants.</p></div>
      </header>
      <section className="card card-pad"><ProductForm onSubmit={create} submitLabel="Create Product" /></section>
    </main>
  );
}
