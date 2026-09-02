'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoadingBlock } from '@/components/loading-block';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '../api/products.api';
import type { Product, UpdateProductInput } from '../types/product.types';
import { productIsActive } from '../utils/product-display';
import { ProductForm } from './product-form';
import { ProductImages } from './product-images';
import { ProductVariants } from './product-variants';

const tabs = ['general', 'images', 'variants'] as const;
type Tab = (typeof tabs)[number];

export function ProductEditScreen({ productId }: { productId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = searchParams.get('tab') as Tab | null;
  const tab: Tab = requested && tabs.includes(requested) ? requested : 'general';

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsApi.get(productId);
      setProduct(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load product.'));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  async function update(payload: UpdateProductInput) {
    try {
      const response = await productsApi.update(productId, payload);
      setProduct(response.data);
      setSuccess('Product updated successfully.');
      window.setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      throw new Error(getApiErrorMessage(err, 'Unable to update product.'));
    }
  }

  function selectTab(next: Tab) {
    router.push(`/admin/products/${productId}/edit?tab=${next}`);
  }

  if (loading) return <main className="page"><section className="card"><LoadingBlock label="Loading product..." /></section></main>;
  if (error || !product) return <main className="page"><div className="alert alert-error">{error ?? 'Product not found.'} <button className="btn btn-small" onClick={() => void load()}>Retry</button></div></main>;

  return (
    <main className="page stack">
      <header className="page-header">
        <div><Link className="link muted" href="/admin/products">← Products</Link><h1 className="page-title" style={{ marginTop: 10 }}>{product.name}</h1><p className="page-subtitle">Manage general details, product images and variants.</p></div>
        <span className={`badge ${productIsActive(product) ? 'badge-success' : 'badge-muted'}`}>{productIsActive(product) ? 'Active' : 'Inactive'}</span>
      </header>

      {success && <div className="alert alert-success">{success}</div>}

      <section className="card">
        <div className="tabs">
          {tabs.map((item) => <button key={item} className={`tab ${tab === item ? 'active' : ''}`} onClick={() => selectTab(item)}>{capitalize(item)}</button>)}
        </div>
        <div className="tab-panel">
          {tab === 'general' && <ProductForm product={product} onSubmit={update} submitLabel="Save Changes" />}
          {tab === 'images' && <ProductImages productId={product.id} images={product.images ?? []} onChanged={load} />}
          {tab === 'variants' && <ProductVariants productId={product.id} variants={product.variants ?? []} onChanged={load} />}
        </div>
      </section>
    </main>
  );
}

function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
