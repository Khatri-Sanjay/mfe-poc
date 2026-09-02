import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { LoadingBlock } from '@/components/loading-block';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '@/features/products/api/products.api';
import type { ApiResponse, Product, ProductQuery } from '@/features/products/types/product.types';
import { productCategoryLabel, productIsActive, productPrice, productRelationLabel, productStock } from '@/features/products/utils/product-display';
import { queryFromSearchParams, queryToSearchParams } from '@/features/products/utils/product-query';

export function ProductListRemote() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const query = useMemo(() => queryFromSearchParams(searchParams), [searchParams]);
  const [response, setResponse] = useState<ApiResponse<Product[]> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setResponse(await productsApi.list(query)); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to load products.')); }
    finally { setLoading(false); }
  }, [query]);

  useEffect(() => { void load(); }, [load]);

  function replaceQuery(next: ProductQuery) {
    const params = queryToSearchParams(next);
    navigate(`${location.pathname}?${params.toString()}`);
  }

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    replaceQuery({
      ...query, page: 1,
      search: stringOrUndefined(data.get('search')),
      category: stringOrUndefined(data.get('category')),
      brand: stringOrUndefined(data.get('brand')),
      minPrice: numberOrUndefined(data.get('minPrice')),
      maxPrice: numberOrUndefined(data.get('maxPrice')),
      inStock: booleanOrUndefined(data.get('inStock')),
      sortBy: (stringOrUndefined(data.get('sortBy')) as ProductQuery['sortBy']) ?? 'createdAt',
      sortOrder: (stringOrUndefined(data.get('sortOrder')) as ProductQuery['sortOrder']) ?? 'desc',
    });
  }

  async function handleDelete(product: Product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;
    try { await productsApi.remove(product.id); await load(); }
    catch (err) { window.alert(getApiErrorMessage(err, 'Unable to delete product.')); }
  }

  const products = response?.data ?? [];
  const meta = response?.meta;

  return (
    <main className="page stack">
      <header className="page-header">
        <div><h1 className="page-title">Products</h1><p className="page-subtitle">Manage products, images, variants, pricing and stock.</p></div>
        <button className="btn btn-primary" onClick={() => navigate('/products/new')}>+ Add Product</button>
      </header>

      <form className="card filters" onSubmit={applyFilters} key={searchParams.toString()}>
        <div className="grid grid-4">
          <Field label="Search"><input className="input" name="search" defaultValue={query.search ?? ''} placeholder="Phone, SKU, name..." /></Field>
          <Field label="Category"><input className="input" name="category" defaultValue={query.category ?? ''} placeholder="phones" /></Field>
          <Field label="Brand"><input className="input" name="brand" defaultValue={query.brand ?? ''} placeholder="apple" /></Field>
          <Field label="Stock"><select className="select" name="inStock" defaultValue={query.inStock === undefined ? '' : String(query.inStock)}><option value="">All</option><option value="true">In stock</option><option value="false">Out of stock</option></select></Field>
          <Field label="Min price"><input className="input" name="minPrice" type="number" min="0" step="0.01" defaultValue={query.minPrice ?? ''} /></Field>
          <Field label="Max price"><input className="input" name="maxPrice" type="number" min="0" step="0.01" defaultValue={query.maxPrice ?? ''} /></Field>
          <Field label="Sort by"><select className="select" name="sortBy" defaultValue={query.sortBy ?? 'createdAt'}><option value="createdAt">Created</option><option value="name">Name</option><option value="price">Price</option></select></Field>
          <Field label="Sort order"><select className="select" name="sortOrder" defaultValue={query.sortOrder ?? 'desc'}><option value="desc">Descending</option><option value="asc">Ascending</option></select></Field>
        </div>
        <div className="filter-actions"><button className="btn" type="button" onClick={() => navigate(location.pathname)}>Clear</button><button className="btn btn-primary" type="submit">Apply filters</button></div>
      </form>

      {error && <div className="alert alert-error">{error} <button className="btn btn-small" onClick={() => void load()} style={{ marginLeft: 10 }}>Retry</button></div>}
      <section className="card">
        {loading ? <LoadingBlock label="Loading products..." /> : products.length === 0 ? <div className="empty">No products matched the current filters.</div> : (
          <div className="table-wrap"><table><thead><tr><th>Product</th><th>Brand</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead><tbody>
            {products.map((product) => {
              const image = product.images?.find((x) => x.isPrimary) ?? product.images?.[0];
              return <tr key={product.id}>
                <td><div className="product-cell">{image?.url ? <img className="thumb" src={image.url} alt={image.altText ?? product.name} /> : <div className="thumb" />}<div><div className="product-name">{product.name}</div><div className="product-slug">{product.slug}</div></div></div></td>
                <td data-label="Brand">{productRelationLabel(product.brand)}</td><td data-label="Category">{productCategoryLabel(product)}</td><td data-label="Price">{money(productPrice(product))}</td><td data-label="Stock">{productStock(product)}</td>
                <td data-label="Status"><span className={`badge ${productIsActive(product) ? 'badge-success' : 'badge-muted'}`}>{productIsActive(product) ? 'Active' : 'Inactive'}</span></td>
                <td data-label="Actions"><div className="actions"><button className="btn btn-small" onClick={() => navigate(`/products/${product.id}/edit`)}>Edit</button><button className="btn btn-small btn-danger" onClick={() => void handleDelete(product)}>Delete</button></div></td>
              </tr>;
            })}
          </tbody></table></div>
        )}
        {meta && meta.totalPages > 1 && <div className="pagination"><div className="pagination-info">Page {meta.page} of {meta.totalPages} · {meta.total} total</div><div className="row"><button className="btn btn-small" disabled={meta.page <= 1} onClick={() => replaceQuery({ ...query, page: meta.page - 1 })}>Previous</button><button className="btn btn-small" disabled={meta.page >= meta.totalPages} onClick={() => replaceQuery({ ...query, page: meta.page + 1 })}>Next</button></div></div>}
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span className="label">{label}</span>{children}</label>; }
function stringOrUndefined(value: FormDataEntryValue | null) { const string = String(value ?? '').trim(); return string || undefined; }
function numberOrUndefined(value: FormDataEntryValue | null) { const string = String(value ?? '').trim(); if (!string) return undefined; const number = Number(string); return Number.isFinite(number) ? number : undefined; }
function booleanOrUndefined(value: FormDataEntryValue | null) { if (value === 'true') return true; if (value === 'false') return false; return undefined; }
function money(value: string | number) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
