'use client';

import { FormEvent, useState } from 'react';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '../api/products.api';
import type { ProductVariant } from '../types/product.types';

export function ProductVariants({ productId, variants, onChanged }: { productId: string; variants: ProductVariant[]; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(null);
    try {
      await productsApi.addVariant(productId, {
        name: String(data.get('name') ?? '').trim() || 'Default',
        sku: String(data.get('sku') ?? '').trim(),
        price: decimalString(data.get('price')),
        quantityOnHand: integerNumber(data.get('stock')),
        isActive: data.get('isActive') === 'on',
        options: parseOptions(data.get('options')),
      });
      form.reset();
      await onChanged();
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to add variant.')); }
    finally { setBusy(false); }
  }

  async function update(event: FormEvent<HTMLFormElement>, variant: ProductVariant) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      await productsApi.updateVariant(productId, variant.id, {
        name: optional(data.get('name')),
        sku: String(data.get('sku') ?? '').trim(),
        price: decimalString(data.get('price')),
        quantityOnHand: integerNumber(data.get('stock')),
        isActive: data.get('isActive') === 'on',
        options: parseOptions(data.get('options')),
      });
      setEditing(null);
      await onChanged();
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to update variant.')); }
    finally { setBusy(false); }
  }

  async function remove(variant: ProductVariant) {
    if (!window.confirm(`Delete variant ${variant.sku}?`)) return;
    setBusy(true); setError(null);
    try { await productsApi.deleteVariant(productId, variant.id); await onChanged(); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to delete variant.')); }
    finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div><h2 className="section-title">Variants</h2><p className="section-subtitle">Manage SKU, price, inventory quantity and option attributes.</p></div>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Variant</th><th>SKU</th><th>Price</th><th>Stock</th><th>Options</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            {variants.length === 0 ? <tr><td colSpan={7}><div className="empty">No variants added yet.</div></td></tr> : variants.map((variant) => editing === variant.id ? (
              <tr key={variant.id}><td colSpan={7}>
                <form className="grid grid-3" onSubmit={(event) => void update(event, variant)}>
                  <Field label="Name"><input className="input" name="name" defaultValue={variant.name ?? ''} /></Field>
                  <Field label="SKU"><input className="input" name="sku" required defaultValue={variant.sku} /></Field>
                  <Field label="Price"><input className="input" name="price" required type="number" min="0" step="0.01" defaultValue={variant.price} /></Field>
                  <Field label="Stock"><input className="input" name="stock" required type="number" min="0" defaultValue={variant.quantityAvailable ?? 0} /></Field>
                  <Field label="Options JSON"><input className="input" name="options" defaultValue={variant.options ? JSON.stringify(variant.options) : ''} /></Field>
                  <label className="field"><span className="label">Status</span><span className="checkbox-line"><input name="isActive" type="checkbox" defaultChecked={variant.isActive ?? true} /> Active</span></label>
                  <div className="row"><button className="btn btn-primary btn-small" disabled={busy}>Save</button><button className="btn btn-small" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
                </form>
              </td></tr>
            ) : (
              <tr key={variant.id}>
                <td>{variant.name ?? '-'}</td><td>{variant.sku}</td><td>{money(variant.price)}</td><td>{variant.quantityAvailable ?? 0}</td><td><code>{variant.options ? JSON.stringify(variant.options) : '-'}</code></td>
                <td><span className={`badge ${(variant.isActive ?? true) ? 'badge-success' : 'badge-muted'}`}>{(variant.isActive ?? true) ? 'Active' : 'Inactive'}</span></td>
                <td><div className="actions"><button className="btn btn-small" onClick={() => setEditing(variant.id)}>Edit</button><button className="btn btn-danger btn-small" disabled={busy} onClick={() => void remove(variant)}>Delete</button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="divider" />
      <form className="stack" onSubmit={add}>
        <div><h3 className="section-title">Add variant</h3><p className="section-subtitle">Example options: {`{"color":"Black","storage":"256GB"}`}</p></div>
        <div className="grid grid-3">
          <Field label="Variant name"><input className="input" name="name" required placeholder="Black / 256GB" /></Field>
          <Field label="SKU"><input className="input" name="sku" required placeholder="PHONE-BLK-256" /></Field>
          <Field label="Price"><input className="input" name="price" required type="number" min="0" step="0.01" /></Field>
          <Field label="Stock"><input className="input" name="stock" required type="number" min="0" /></Field>
          <Field label="Options JSON"><input className="input" name="options" placeholder='{"color":"Black"}' /></Field>
          <label className="field"><span className="label">Status</span><span className="checkbox-line"><input name="isActive" type="checkbox" defaultChecked /> Active</span></label>
        </div>
        <div><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Add Variant'}</button></div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span className="label">{label}</span>{children}</label>; }
function optional(value: FormDataEntryValue | null) { const string = String(value ?? '').trim(); return string || undefined; }
function parseOptions(value: FormDataEntryValue | null): Record<string, string> | undefined {
  const text = String(value ?? '').trim();
  if (!text) return undefined;
  const parsed = JSON.parse(text) as unknown;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Options must be a JSON object.');
  return Object.fromEntries(Object.entries(parsed as Record<string, unknown>).map(([key, val]) => [key, String(val)]));
}
function decimalString(value: FormDataEntryValue | null) {
  const number = Number(value ?? '');
  if (!Number.isFinite(number) || number < 0) throw new Error('Enter a valid price.');
  return number.toFixed(2);
}
function integerNumber(value: FormDataEntryValue | null) {
  const number = Number(value ?? 0);
  if (!Number.isInteger(number) || number < 0) throw new Error('Enter a valid stock quantity.');
  return number;
}
function money(value: string | number) { return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(Number(value || 0)); }
