import { useNavigate } from 'react-router-dom';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '@/features/products/api/products.api';
import type { CreateProductInput } from '@/features/products/types/product.types';
import { ProductForm } from '@/features/products/components/product-form';

export function ProductCreateRemote() {
  const navigate = useNavigate();
  async function create(payload: CreateProductInput) {
    try {
      const response = await productsApi.create(payload);
      navigate(`/products/${response.data.id}/edit?tab=images`, { replace: true });
    } catch (error) { throw new Error(getApiErrorMessage(error, 'Unable to create product.')); }
  }
  return <main className="page stack">
    <header className="page-header"><div><button className="link-button muted" onClick={() => navigate('/products')}>← Products</button><h1 className="page-title" style={{ marginTop: 10 }}>Create Product</h1><p className="page-subtitle">Create the base product, then add its images and variants.</p></div></header>
    <section className="card card-pad"><ProductForm onSubmit={create} submitLabel="Create Product" /></section>
  </main>;
}
