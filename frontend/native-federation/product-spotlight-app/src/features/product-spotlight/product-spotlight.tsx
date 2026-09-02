import { useEffect, useMemo, useState } from 'react';
import { getSpotlightProducts } from './api/product-spotlight.api';
import { productSpotlightStyles } from './product-spotlight.styles';
import type { Product } from './product-spotlight.types';
import { findBestDeal, formatMoney, imageUrl, primaryVariant } from './product-spotlight.utils';

export interface ProductSpotlightProps {
  apiBaseUrl: string;
  heading?: string;
  productUrlPrefix?: string;
  onProductSelect?: (product: Product) => void;
  onViewAll?: () => void;
}

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

export function ProductSpotlight({
  apiBaseUrl,
  heading = 'React product spotlight',
  productUrlPrefix = '/products',
  onProductSelect,
  onViewAll,
}: ProductSpotlightProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [state, setState] = useState<LoadState>('loading');

  useEffect(() => {
    const controller = new AbortController();
    setState('loading');

    getSpotlightProducts(
      apiBaseUrl,
      {
        page: 1,
        limit: 6,
        sortBy: 'price',
        sortOrder: 'asc',
        inStock: true,
      },
      controller.signal,
    )
      .then((items) => {
        setProducts(items);
        setState(items.length > 0 ? 'ready' : 'empty');
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setProducts([]);
        setState('error');
      });

    return () => controller.abort();
  }, [apiBaseUrl]);

  const bestDeal = useMemo(() => findBestDeal(products), [products]);

  return (
    <section className="spotlight-shell" aria-label="Product spotlight">
      <style>{productSpotlightStyles}</style>

      <div className="spotlight-heading">
        <div>
          <p className="eyebrow">Federated React remote</p>
          <h2>{heading}</h2>
        </div>
        <button type="button" className="text-button" onClick={onViewAll}>
          View all
        </button>
      </div>

      {state === 'loading' && <Skeleton />}
      {state === 'error' && (
        <Message title="Product spotlight is unavailable" text="The React remote loaded, but the product API request failed." />
      )}
      {state === 'empty' && <Message title="No products found" text="The API returned no in-stock products for this spotlight." />}

      {state === 'ready' && (
        <div className="spotlight-layout">
          {bestDeal && (
            <button type="button" className="hero-product" onClick={() => onProductSelect?.(bestDeal.product)}>
              <img src={imageUrl(bestDeal.product)} alt={bestDeal.product.name} />
              <span className="deal-badge">{bestDeal.discount > 0 ? `${bestDeal.discount}% off` : 'Featured'}</span>
              <span className="hero-copy">
                <small>{bestDeal.product.brand?.name ?? 'Independent'}</small>
                <strong>{bestDeal.product.name}</strong>
                <span>{formatMoney(bestDeal.variant.price, bestDeal.variant.currency)}</span>
              </span>
            </button>
          )}

          <div className="product-strip">
            {products.slice(0, 4).map((product) => {
              const variant = primaryVariant(product);

              return (
                <a
                  key={product.id}
                  className="mini-product"
                  href={`${productUrlPrefix}/${product.slug}`}
                  onClick={(event) => {
                    event.preventDefault();
                    onProductSelect?.(product);
                  }}
                >
                  <img src={imageUrl(product)} alt={product.name} />
                  <span>
                    <small>{product.brand?.name ?? 'Independent'}</small>
                    <strong>{product.name}</strong>
                    <em>{variant ? formatMoney(variant.price, variant.currency) : 'View details'}</em>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="spotlight-layout" aria-hidden="true">
      <div className="skeleton hero-skeleton" />
      <div className="product-strip">
        <div className="skeleton row-skeleton" />
        <div className="skeleton row-skeleton" />
        <div className="skeleton row-skeleton" />
      </div>
    </div>
  );
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <div className="message">
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
