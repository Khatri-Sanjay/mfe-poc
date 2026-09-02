import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { searchProductComparison } from '../api'
import { PRICE_LENS_API_BASE_URL } from '../config'
import type { ProductComparison } from '../types'

type SearchState =
  | { query: string; status: 'idle'; comparison: null; error: null }
  | { query: string; status: 'loading'; comparison: null; error: null }
  | { query: string; status: 'success'; comparison: ProductComparison; error: null }
  | { query: string; status: 'error'; comparison: null; error: string }

const popularSearches = ['iPhone 15 128GB', 'Samsung Galaxy S24', 'Nike running shoes', 'MacBook Air M3']

function getRouteQuery(routeQuery?: string, searchQuery?: string): string {
  return decodeURIComponent(routeQuery ?? searchQuery ?? '').trim()
}

function formatMoney(value: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value)
}

export default function PriceLensPage() {
  const params = useParams<{ query?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const activeQuery = getRouteQuery(params.query, searchParams.get('q') ?? undefined)
  const [inputState, setInputState] = useState(() => ({
    query: activeQuery,
    value: activeQuery,
  }))
  const [searchState, setSearchState] = useState<SearchState>(() =>
    activeQuery
      ? { query: activeQuery, status: 'loading', comparison: null, error: null }
      : { query: '', status: 'idle', comparison: null, error: null },
  )

  useEffect(() => {
    if (!activeQuery) {
      return
    }

    let cancelled = false

    searchProductComparison(PRICE_LENS_API_BASE_URL, activeQuery)
      .then((comparison) => {
        if (!cancelled) {
          setSearchState({ query: activeQuery, status: 'success', comparison, error: null })
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setSearchState({
            query: activeQuery,
            status: 'error',
            comparison: null,
            error: err instanceof Error ? err.message : 'Unable to compare prices right now',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeQuery])

  const inputQuery = inputState.query === activeQuery ? inputState.value : activeQuery
  const comparison = searchState.query === activeQuery ? searchState.comparison : null
  const loading = searchState.query === activeQuery && searchState.status === 'loading'
  const error = searchState.query === activeQuery && searchState.status === 'error' ? searchState.error : null
  const cheapestOffer = useMemo(() => comparison?.offers.find((offer) => offer.isCheapest), [comparison])
  const bestRatedOffer = useMemo(
    () =>
      comparison?.offers
        .filter((offer) => offer.rating !== undefined)
        .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.totalPriceUsd - b.totalPriceUsd)[0],
    [comparison],
  )
  const bestValueOffer = useMemo(
    () => comparison?.offers.find((offer) => offer.store === comparison.recommendations.bestValue),
    [comparison],
  )
  const regionCount = useMemo(
    () => new Set(comparison?.offers.map((offer) => offer.region).filter(Boolean)).size,
    [comparison],
  )

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextQuery = inputQuery.trim()

    if (nextQuery) {
      setSearchState({ query: nextQuery, status: 'loading', comparison: null, error: null })
      navigate(`/search/${encodeURIComponent(nextQuery)}`)
    } else {
      navigate('/')
    }
  }

  function selectSearch(query: string) {
    setInputState({ query, value: query })
    setSearchState({ query, status: 'loading', comparison: null, error: null })
    navigate(`/search/${encodeURIComponent(query)}`)
  }

  return (
    <main className="price-lens">
      <section className="search-panel">
        <div className="search-panel__copy">
          <p className="eyebrow">Independent price intelligence</p>
          <h1>Search any product and compare market prices</h1>
          <p>
            Price Lens compares global, Nepal, India, United States, United Kingdom, China, and Japan
            marketplace search results with every offer normalized to USD and NPR.
          </p>
        </div>

        <form className="product-form product-form--large" onSubmit={submitSearch}>
          <label htmlFor="product-search">Product name</label>
          <div>
            <input
              id="product-search"
              value={inputQuery}
              onChange={(event) =>
                setInputState({
                  query: activeQuery,
                  value: event.target.value,
                })
              }
              placeholder="Search iPhone 15, running shoes, headphones..."
            />
            <button type="submit" disabled={!inputQuery.trim() || loading}>
              {loading ? 'Searching' : 'Compare'}
            </button>
          </div>
        </form>

        <div className="quick-searches" aria-label="Popular searches">
          <span>Popular</span>
          {popularSearches.map((query) => (
            <button key={query} type="button" onClick={() => selectSearch(query)}>
              {query}
            </button>
          ))}
        </div>
      </section>

      {!activeQuery && (
        <section className="empty-state empty-state--guide">
          <h2>Start with a product name</h2>
          <p>Search by model, storage, color, or any product description you would use on a marketplace.</p>
        </section>
      )}

      {loading && (
        <section className="empty-state">
          <h2>Searching marketplace sources</h2>
          <p>Normalizing offers, shipping cost, availability, and ratings.</p>
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
              <p className="eyebrow">Search result</p>
              <h2>{comparison.product.name}</h2>
              <p>{comparison.offers.length} comparable offers found across marketplace sources.</p>
            </div>
            <div className="market-signal">
              <span>Lowest total price</span>
              <strong>{formatMoney(comparison.market.lowestPriceNpr, 'NPR')}</strong>
              <small>{formatMoney(comparison.market.lowestPriceUsd, 'USD')}</small>
            </div>
          </section>

          <section className="top-offer-strip" aria-label="Best offer">
            <div>
              <span className="badge">Best match</span>
              <strong>{cheapestOffer?.title ?? 'No offer available'}</strong>
              <p>
                {cheapestOffer?.store ?? comparison.recommendations.cheapest}
                {cheapestOffer?.region ? ` · ${cheapestOffer.region}` : ''}
              </p>
            </div>
            <a href={cheapestOffer?.url ?? '#'} target="_blank" rel="noreferrer" aria-disabled={!cheapestOffer}>
              View lowest offer
            </a>
          </section>

          <section className="metrics-grid" aria-label="Price summary">
            <article>
              <span>Lowest NPR</span>
              <strong>{formatMoney(comparison.market.lowestPriceNpr, 'NPR')}</strong>
              <p>{formatMoney(comparison.market.lowestPriceUsd, 'USD')}</p>
            </article>
            <article>
              <span>Average NPR</span>
              <strong>{formatMoney(comparison.market.averagePriceNpr, 'NPR')}</strong>
              <p>{formatMoney(comparison.market.averagePriceUsd, 'USD')}</p>
            </article>
            <article>
              <span>Highest NPR</span>
              <strong>{formatMoney(comparison.market.highestPriceNpr, 'NPR')}</strong>
              <p>{formatMoney(comparison.market.highestPriceUsd, 'USD')}</p>
            </article>
            <article>
              <span>Coverage</span>
              <strong>{comparison.offers.length} sites</strong>
              <p>{regionCount} regions</p>
            </article>
          </section>

          <section className="recommendations" aria-label="Recommendations">
            <article>
              <span className="badge">Cheapest</span>
              <strong>{cheapestOffer?.store ?? comparison.recommendations.cheapest}</strong>
              <p>{cheapestOffer ? `${formatMoney(cheapestOffer.totalPriceNpr, 'NPR')} · ${formatMoney(cheapestOffer.totalPriceUsd, 'USD')}` : 'No offer'}</p>
            </article>
            <article>
              <span className="badge">Best Rated</span>
              <strong>{bestRatedOffer?.store ?? comparison.recommendations.bestRated}</strong>
              <p>{bestRatedOffer?.rating ? `${bestRatedOffer.rating.toFixed(1)} rating` : 'No rating'}</p>
            </article>
            <article>
              <span className="badge">Best Value</span>
              <strong>{bestValueOffer?.store ?? comparison.recommendations.bestValue}</strong>
              <p>{bestValueOffer ? `${formatMoney(bestValueOffer.totalPriceNpr, 'NPR')} · ${formatMoney(bestValueOffer.totalPriceUsd, 'USD')}` : 'No offer'}</p>
            </article>
          </section>

          <section className="comparison-section">
            <div className="section-heading">
              <h2>Offer Comparison</h2>
              <span>{comparison.offers.length} offers</span>
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Website</th>
                    <th>Region</th>
                    <th>Item</th>
                    <th>Local</th>
                    <th>USD</th>
                    <th>NPR</th>
                    <th>Rating</th>
                    <th>Availability</th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.offers.map((offer) => (
                    <tr key={`${offer.store}-${offer.url}`} className={offer.isCheapest ? 'is-cheapest' : undefined}>
                      <td>
                        <strong>{offer.store}</strong>
                        <a href={offer.url} target="_blank" rel="noreferrer">
                          View source
                        </a>
                      </td>
                      <td>
                        <span className="region-pill">{offer.region ?? 'Global'}</span>
                      </td>
                      <td>{offer.title}</td>
                      <td>
                        <strong>{formatMoney(offer.totalPrice, offer.currency)}</strong>
                        <span>{offer.shippingCost ? `Includes ${formatMoney(offer.shippingCost, offer.currency)} shipping` : 'Free shipping'}</span>
                      </td>
                      <td>{formatMoney(offer.totalPriceUsd, 'USD')}</td>
                      <td>{formatMoney(offer.totalPriceNpr, 'NPR')}</td>
                      <td>{offer.rating ? offer.rating.toFixed(1) : 'N/A'}</td>
                      <td>{offer.availability ?? 'Unknown'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  )
}
