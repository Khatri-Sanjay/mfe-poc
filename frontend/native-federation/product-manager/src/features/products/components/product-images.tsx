'use client';

import { FormEvent, useState } from 'react';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '../api/products.api';
import type { ProductImage } from '../types/product.types';

export function ProductImages({ productId, images, onChanged }: { productId: string; images: ProductImage[]; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true); setError(null);
    try {
      await productsApi.addImage(productId, {
        url: String(data.get('url') ?? '').trim(),
        altText: optional(data.get('altText')),
        sortOrder: optionalNumber(data.get('sortOrder')),
        isPrimary: data.get('isPrimary') === 'on',
      });
      form.reset();
      await onChanged();
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to add image.')); }
    finally { setBusy(false); }
  }

  async function remove(image: ProductImage) {
    if (!window.confirm('Delete this image?')) return;
    setBusy(true); setError(null);
    try { await productsApi.deleteImage(productId, image.id); await onChanged(); }
    catch (err) { setError(getApiErrorMessage(err, 'Unable to delete image.')); }
    finally { setBusy(false); }
  }

  async function update(event: FormEvent<HTMLFormElement>, image: ProductImage) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setBusy(true); setError(null);
    try {
      await productsApi.updateImage(productId, image.id, {
        url: optional(data.get('url')),
        altText: optional(data.get('altText')),
        sortOrder: optionalNumber(data.get('sortOrder')),
        isPrimary: data.get('isPrimary') === 'on',
      });
      setEditing(null);
      await onChanged();
    } catch (err) { setError(getApiErrorMessage(err, 'Unable to update image.')); }
    finally { setBusy(false); }
  }

  return (
    <div className="stack">
      <div><h2 className="section-title">Images</h2><p className="section-subtitle">The supplied API accepts image metadata as JSON, so this manager uses image URLs.</p></div>
      {error && <div className="alert alert-error">{error}</div>}

      {images.length === 0 ? <div className="empty card">No images added yet.</div> : (
        <div className="image-grid">
          {images.map((image) => (
            <article className="image-card" key={image.id}>
              <img src={image.url} alt={image.altText ?? 'Product'} />
              <div className="image-card-body">
                <div className="row-between"><span className={`badge ${image.isPrimary ? 'badge-success' : 'badge-muted'}`}>{image.isPrimary ? 'Primary' : `Sort ${image.sortOrder ?? '-'}`}</span></div>
                {editing === image.id ? (
                  <form className="stack" onSubmit={(event) => void update(event, image)}>
                    <input className="input" name="url" defaultValue={image.url} placeholder="Image URL" />
                    <input className="input" name="altText" defaultValue={image.altText ?? ''} placeholder="Alt text" />
                    <input className="input" name="sortOrder" type="number" min="0" defaultValue={image.sortOrder ?? 0} />
                    <label className="checkbox-line"><input name="isPrimary" type="checkbox" defaultChecked={image.isPrimary} /> Primary</label>
                    <div className="row"><button className="btn btn-primary btn-small" disabled={busy}>Save</button><button className="btn btn-small" type="button" onClick={() => setEditing(null)}>Cancel</button></div>
                  </form>
                ) : (
                  <div className="actions"><button className="btn btn-small" onClick={() => setEditing(image.id)}>Edit</button><button className="btn btn-danger btn-small" disabled={busy} onClick={() => void remove(image)}>Delete</button></div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="divider" />
      <form className="stack" onSubmit={add}>
        <div><h3 className="section-title">Add image</h3><p className="section-subtitle">Create image metadata for this product.</p></div>
        <div className="grid grid-2">
          <Field label="Image URL"><input className="input" name="url" type="url" required placeholder="https://cdn.example.com/product.jpg" /></Field>
          <Field label="Alt text"><input className="input" name="altText" /></Field>
          <Field label="Sort order"><input className="input" name="sortOrder" type="number" min="0" defaultValue="0" /></Field>
          <label className="field"><span className="label">Primary</span><span className="checkbox-line"><input name="isPrimary" type="checkbox" /> Set as primary image</span></label>
        </div>
        <div><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving...' : 'Add Image'}</button></div>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="field"><span className="label">{label}</span>{children}</label>; }
function optional(value: FormDataEntryValue | null) { const string = String(value ?? '').trim(); return string || undefined; }
function optionalNumber(value: FormDataEntryValue | null) { const string = String(value ?? '').trim(); if (!string) return undefined; const number = Number(string); return Number.isFinite(number) ? number : undefined; }
