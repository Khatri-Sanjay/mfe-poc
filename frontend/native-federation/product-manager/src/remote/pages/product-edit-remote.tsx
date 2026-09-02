import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { LoadingBlock } from '@/components/loading-block';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '@/features/products/api/products.api';
import type { Product, UpdateProductInput } from '@/features/products/types/product.types';
import { ProductForm } from '@/features/products/components/product-form';
import { ProductImages } from '@/features/products/components/product-images';
import { ProductVariants } from '@/features/products/components/product-variants';
import { productIsActive } from '@/features/products/utils/product-display';

const tabs = ['general', 'images', 'variants'] as const;
type Tab = (typeof tabs)[number];

export function ProductEditRemote() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requested = searchParams.get('tab') as Tab | null;
  const tab: Tab = requested && tabs.includes(requested) ? requested : 'general';
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!productId) return;
    setLoading(true); setError(null);
    try { const response = await productsApi.get(productId); setProduct(response.data); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to load product.')); }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { void load(); }, [load]);

  async function update(payload: UpdateProductInput) {
    if (!productId) return;
    try {
      const response = await productsApi.update(productId, payload);
      setProduct(response.data); setSuccess('Product updated successfully.');
      window.setTimeout(() => setSuccess(null), 2500);
    } catch (err) { throw new Error(getApiErrorMessage(err, 'Unable to update product.')); }
  }

  if (!productId) return <main className="page"><div className="alert alert-error">Missing product id.</div></main>;
  if (loading) return <main className="page"><section className="card"><LoadingBlock label="Loading product..." /></section></main>;
  if (error || !product) return <main className="page"><div className="alert alert-error">{error ?? 'Product not found.'} <button className="btn btn-small" onClick={() => void load()}>Retry</button></div></main>;

  return <main className="page stack">
    <header className="page-header"><div><button className="link-button muted" onClick={() => navigate('/products')}>← Products</button><h1 className="page-title" style={{ marginTop: 10 }}>{product.name}</h1><p className="page-subtitle">Manage general details, product images and variants.</p></div><span className={`badge ${productIsActive(product) ? 'badge-success' : 'badge-muted'}`}>{productIsActive(product) ? 'Active' : 'Inactive'}</span></header>
    {success && <div className="alert alert-success">{success}</div>}
    <section className="card"><div className="tabs">{tabs.map((item) => <button key={item} className={`tab ${tab === item ? 'active' : ''}`} onClick={() => navigate(`/products/${productId}/edit?tab=${item}`)}>{capitalize(item)}</button>)}</div><div className="tab-panel">
      {tab === 'general' && <ProductForm product={product} onSubmit={update} submitLabel="Save Changes" />}
      {tab === 'images' && <ProductImages productId={product.id} images={product.images ?? []} onChanged={load} />}
      {tab === 'variants' && <ProductVariants productId={product.id} variants={product.variants ?? []} onChanged={load} />}
    </div></section>
  </main>;
}
function capitalize(value: string) { return value.charAt(0).toUpperCase() + value.slice(1); }
