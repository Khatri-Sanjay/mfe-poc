'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { getApiErrorMessage } from '@/lib/auth/api-client';
import { productsApi } from '../api/products.api';
import type { CreateProductInput, Product, ProductRelation, UpdateProductInput } from '../types/product.types';
import {
  productCompareAtPrice,
  productPrimaryVariant,
  productRelationInputValue,
  productStock,
} from '../utils/product-display';

type ProductFormProps =
  | {
      product?: undefined;
      onSubmit: (payload: CreateProductInput) => Promise<void>;
      submitLabel: string;
    }
  | {
      product: Product;
      onSubmit: (payload: UpdateProductInput) => Promise<void>;
      submitLabel: string;
    };

export function ProductForm({
  product,
  onSubmit,
  submitLabel,
}: ProductFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lookups, setLookups] = useState<{ brands: ProductRelation[]; categories: ProductRelation[] }>({
    brands: [],
    categories: [],
  });
  const [lookupError, setLookupError] = useState<string | null>(null);
  const isEdit = Boolean(product);
  const defaultVariant = productPrimaryVariant(product);
  const selectedCategoryIds = useMemo(
    () => new Set(product?.categories?.map((category) => category.id).filter(Boolean) ?? []),
    [product],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadLookups() {
      setLookupError(null);

      try {
        const [brandsResponse, categoriesResponse] = await Promise.all([
          productsApi.listBrands(),
          productsApi.listCategories(),
        ]);

        if (!cancelled) {
          setLookups({
            brands: brandsResponse.data ?? [],
            categories: categoriesResponse.data ?? [],
          });
        }
      } catch (err) {
        if (!cancelled) {
          setLookupError(getApiErrorMessage(err, 'Unable to load brands and categories.'));
        }
      }
    }

    void loadLookups();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const data = new FormData(event.currentTarget);

    try {
      const name = String(data.get('name') ?? '').trim();

      if (!name) throw new Error('Product name is required.');

      const basePayload: UpdateProductInput = {
        name,
        slug: optional(data.get('slug')),
        description: optional(data.get('description')),
        shortDescription: optional(data.get('shortDescription')),
        brandId: optional(data.get('brandId')),
        categoryIds: checkedValues(data.getAll('categoryIds')),
        status: data.get('status') as UpdateProductInput['status'],
      };

      if (isEdit) {
        await (onSubmit as (payload: UpdateProductInput) => Promise<void>)(basePayload);
        return;
      }

      const sku = String(data.get('sku') ?? '').trim();
      const variantName = String(data.get('variantName') ?? '').trim() || 'Default';
      const price = decimalString(data.get('price'));
      const compareAtPrice = optionalDecimalString(data.get('compareAtPrice'));
      const quantityOnHand = integerNumber(data.get('quantityOnHand'));
      const currency = String(data.get('currency') ?? 'AUD').trim().toUpperCase() || 'AUD';

      if (!sku) throw new Error('SKU is required.');
      if (!price) throw new Error('Enter a valid price.');
      if (!Number.isInteger(quantityOnHand) || quantityOnHand < 0) throw new Error('Enter a valid quantity.');
      if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Currency must be a 3-letter code, for example AUD.');

      await (onSubmit as (payload: CreateProductInput) => Promise<void>)({
        name,
        slug: basePayload.slug,
        description: basePayload.description,
        shortDescription: basePayload.shortDescription,
        brandId: basePayload.brandId,
        categoryIds: basePayload.categoryIds,
        status: basePayload.status,
        variants: [
          {
            sku,
            name: variantName,
            price,
            compareAtPrice,
            currency,
            quantityOnHand,
            isActive: data.get('variantIsActive') === 'on',
          },
        ],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}
      {lookupError && <div className="alert alert-error">{lookupError}</div>}
      <div className="grid grid-2">
        <Field label="Product name"><input className="input" name="name" required defaultValue={product?.name ?? ''} /></Field>
        <Field label="Slug"><input className="input" name="slug" defaultValue={product?.slug ?? ''} placeholder="iphone-17-pro" /></Field>
        <Field label="Brand">
          <select className="select" name="brandId" defaultValue={productRelationInputValue(product?.brand)}>
            <option value="">No brand</option>
            {lookups.brands.map((brand) => (
              <option key={brand.id} value={brand.id}>{brand.name ?? brand.slug ?? brand.id}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="select" name="status" defaultValue={product?.status ?? 'DRAFT'}>
            <option value="DRAFT">Draft</option>
            <option value="ACTIVE">Active</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>
      </div>
      <div className="field">
        <span className="label">Categories</span>
        <div className="option-grid">
          {lookups.categories.length === 0 ? (
            <span className="muted">No categories available.</span>
          ) : (
            lookups.categories.map((category) => (
              <label className="checkbox-line option-chip" key={category.id}>
                <input
                  type="checkbox"
                  name="categoryIds"
                  value={category.id}
                  defaultChecked={Boolean(category.id && selectedCategoryIds.has(category.id))}
                />
                {category.name ?? category.slug ?? category.id}
              </label>
            ))
          )}
        </div>
      </div>
      <Field label="Short description"><textarea className="textarea" name="shortDescription" defaultValue={product?.shortDescription ?? ''} /></Field>
      <Field label="Description"><textarea className="textarea" name="description" defaultValue={product?.description ?? ''} /></Field>

      {!isEdit && (
        <>
          <div className="divider" />
          <div><h2 className="section-title">Default Variant</h2><p className="section-subtitle">The API requires at least one variant when creating a product.</p></div>
          <div className="grid grid-3">
            <Field label="Variant name"><input className="input" name="variantName" required defaultValue={defaultVariant?.name ?? 'Default'} /></Field>
            <Field label="SKU"><input className="input" name="sku" required placeholder="SKU-001" defaultValue={defaultVariant?.sku ?? ''} /></Field>
            <Field label="Price"><input className="input" name="price" required type="number" min="0" step="0.01" defaultValue={defaultVariant?.price ?? 0} /></Field>
            <Field label="Compare at price"><input className="input" name="compareAtPrice" type="number" min="0" step="0.01" defaultValue={productCompareAtPrice(product) ?? ''} /></Field>
            <Field label="Quantity"><input className="input" name="quantityOnHand" required type="number" min="0" step="1" defaultValue={product ? productStock(product) : 0} /></Field>
            <Field label="Currency"><input className="input" name="currency" required maxLength={3} defaultValue={defaultVariant?.currency ?? 'AUD'} /></Field>
            <label className="field"><span className="label">Variant status</span><span className="checkbox-line"><input type="checkbox" name="variantIsActive" defaultChecked={defaultVariant?.isActive ?? true} /> Active variant</span></label>
          </div>
        </>
      )}

      <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : submitLabel}</button></div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span className="label">{label}</span>{children}</label>;
}
function optional(value: FormDataEntryValue | null) {
  const string = String(value ?? '').trim();
  return string || undefined;
}
function optionalNumber(value: FormDataEntryValue | null) {
  const string = String(value ?? '').trim();
  if (!string) return undefined;
  const number = Number(string);
  return Number.isFinite(number) ? number : undefined;
}

function checkedValues(values: FormDataEntryValue[]) {
  const strings = values
    .map((item) => String(item).trim())
    .filter(Boolean);

  return strings.length ? strings : undefined;
}

function decimalString(value: FormDataEntryValue | null) {
  const number = optionalNumber(value);
  if (number === undefined || number < 0) return undefined;
  return number.toFixed(2);
}

function optionalDecimalString(value: FormDataEntryValue | null) {
  const text = decimalString(value);
  return text || undefined;
}

function integerNumber(value: FormDataEntryValue | null) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? Math.trunc(number) : Number.NaN;
}
