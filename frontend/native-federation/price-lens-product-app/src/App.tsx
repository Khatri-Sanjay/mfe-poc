import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { getProductComparison } from './api'
import type { ProductComparison } from './types'

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api/v1'

interface AppProps {
  apiBaseUrl?: string
  productId?: string
}

function getInitialProductId(productId?: string): string {
  if (productId) return productId
  return new URLSearchParams(window.location.search).get('productId') ?? ''
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

function App({ apiBaseUrl = DEFAULT_API_BASE_URL, productId }: AppProps) {
  const [requestedProductId, setRequestedProductId] = useState(() => getInitialProductId(productId))
  const [inputProductId, setInputProductId] = useState(() => getInitialProductId(productId))
  const [comparison, setComparison] = useState<ProductComparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!requestedProductId) return

    let cancelled = false
    setLoading(true)
    setError(null)

    getProductComparison(apiBaseUrl, requestedProductId)
      .then((result) => {
        if (!cancelled) setComparison(result)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load product comparison')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [apiBaseUrl, requestedProductId])

  const currency = comparison?.product.currency ?? 'USD'
  const cheapestOffer = useMemo(() => comparison?.offers.find((offer) => offer.isCheapest), [comparison])
  const bestRatedOffer = useMemo(
    () =>
      comparison?.offers
        .filter((offer) => offer.rating !== undefined)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0],
    [comparison],
  )
  const bestValueOffer = useMemo(
    () => comparison?.offers.find((offer) => offer.store === comparison.recommendations.bestValue),
    [comparison],
  )

  function submitProductId(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setRequestedProductId(inputProductId.trim())
  }

  return (
    <main className="price-lens">
      <header className="price-lens__header">
        <div>
          <p className="eyebrow">Product intelligence</p>
          <h1>Price Lens</h1>
        </div>
        <form className="product-form" onSubmit={submitProductId}>
          <label htmlFor="product-id">Product ID</label>
          <div>
            <input
              id="product-id"
              value={inputProductId}
              onChange={(event) => setInputProductId(event.target.value)}
              placeholder="Paste a product UUID"
            />
            <button type="submit" disabled={!inputProductId.trim() || loading}>
              Compare
            </button>
          </div>
        </form>
      </header>

      {!requestedProductId && (
        <section className="empty-state">
          <h2>Select a product to compare</h2>
          <p>Open this app with a product ID or paste one above to load normalized market offers.</p>
        </section>
      )}

      {loading && (
        <section className="empty-state">
          <h2>Loading comparison</h2>
          <p>Checking source adapters and matching the same product variant.</p>
        </section>
      )}

      {error && (
        <section className="empty-state empty-state--error">
          <h2>Comparison unavailable</h2>
          <p>{error}</p>
        </section>
      )}

      {comparison && !loading && !error && (
        <>
          <section className="product-summary">
            <div>
              <p className="eyebrow">Product</p>
              <h2>{comparison.product.name}</h2>
              <p>
                {[comparison.product.variant, comparison.product.storage, comparison.product.color]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <div className="market-signal">
              <span>Potential saving</span>
              <strong>{formatMoney(comparison.market.potentialSaving, currency)}</strong>
            </div>
          </section>

          <section className="metrics-grid" aria-label="Price summary">
            <article>
              <span>Our Price</span>
              <strong>{formatMoney(comparison.product.ourPrice, currency)}</strong>
            </article>
            <article>
              <span>Lowest Price</span>
              <strong>{formatMoney(comparison.market.lowestPrice, currency)}</strong>
            </article>
            <article>
              <span>Average Price</span>
              <strong>{formatMoney(comparison.market.averagePrice, currency)}</strong>
            </article>
            <article>
              <span>Difference</span>
              <strong>{formatMoney(comparison.market.differenceFromLowest, currency)}</strong>
            </article>
          </section>

          <section className="comparison-section">
            <div className="section-heading">
              <h2>Comparison Table</h2>
              <span>{comparison.offers.length} matched offers</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Website</th>
                    <th>Price</th>
                    <th>Shipping</th>
                    <th>Total</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.offers.map((offer) => (
                    <tr key={`${offer.store}-${offer.url}`} className={offer.isCheapest ? 'is-cheapest' : undefined}>
                      <td>
                        <strong>{offer.store}</strong>
                        <span>{offer.title}</span>
                      </td>
                      <td>{formatMoney(offer.price, offer.currency)}</td>
                      <td>{offer.shippingCost ? formatMoney(offer.shippingCost, offer.currency) : 'Free'}</td>
                      <td>{formatMoney(offer.totalPrice, offer.currency)}</td>
                      <td>{offer.availability ?? 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="recommendations" aria-label="Recommendations">
            <article>
              <span className="badge">Cheapest</span>
              <strong>{cheapestOffer?.store ?? comparison.recommendations.cheapest}</strong>
              <p>{cheapestOffer ? formatMoney(cheapestOffer.totalPrice, cheapestOffer.currency) : 'No offer'}</p>
            </article>
            <article>
              <span className="badge">Best Rated</span>
              <strong>{bestRatedOffer?.store ?? comparison.recommendations.bestRated}</strong>
              <p>{bestRatedOffer?.rating ? `${bestRatedOffer.rating.toFixed(1)} rating` : 'No rating'}</p>
            </article>
            <article>
              <span className="badge">Best Value</span>
              <strong>{bestValueOffer?.store ?? comparison.recommendations.bestValue}</strong>
              <p>{bestValueOffer ? formatMoney(bestValueOffer.totalPrice, bestValueOffer.currency) : 'No offer'}</p>
            </article>
          </section>
        </>
      )}
    </main>
  )
}

export default App
