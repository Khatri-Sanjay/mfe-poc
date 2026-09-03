import type { FormEvent } from 'react'
import heroImage from '../assets/hero.png'
import type { ProductComparison, ProductComparisonOffer, Recommendation } from '../types'
import { formatCompactMoney, formatDateTime, formatMoney } from '../utils/format'

export type OfferFilters = {
  countryCode: string
  minRating: number
  availability: string
  store: string
  sort: string
}

export function SearchBar({
  value,
  loading,
  onChange,
  onSubmit,
}: {
  value: string
  loading: boolean
  onChange: (value: string) => void
  onSubmit: () => void
}) {
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="search-bar" onSubmit={submit}>
      <label htmlFor="product-search">Search product</label>
      <div>
        <input
          id="product-search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Samsung Galaxy S24"
          autoComplete="off"
        />
        <button type="submit" disabled={!value.trim() || loading}>
          {loading ? 'Searching' : 'Compare'}
        </button>
      </div>
    </form>
  )
}

export function ProductHeader({ comparison }: { comparison: ProductComparison }) {
  return (
    <section className="product-header">
      <div className="product-header-copy">
        <ProductImage imageUrl={comparison.product.imageUrl} name={comparison.product.name} className="product-artwork" />
        <div>
          <span className="eyebrow">Product intelligence</span>
          <h1>{comparison.product.name}</h1>
          <p>
            {[comparison.product.brand, comparison.product.category].filter(Boolean).join(' · ') || 'Compared marketplace offer'}
          </p>
        </div>
      </div>
      <div className="header-meta">
        <strong>{comparison.summary.offersCount} stores compared</strong>
        <span>{comparison.summary.availableOffersCount} currently available</span>
        <span>Last updated {formatDateTime(comparison.metadata.generatedAt)}</span>
      </div>
    </section>
  )
}

export function BestDealCard({ recommendation }: { recommendation?: Recommendation }) {
  if (!recommendation) {
    return <EmptyState title="No best deal available" message="Comparable recommendations are unavailable for this result." />
  }

  return (
    <section className="best-deal">
      <div>
        <span className="badge badge-strong">Best Overall Deal</span>
        <h2>{recommendation.store}</h2>
        <strong>{formatMoney(recommendation.totalPrice, recommendation.currency)}</strong>
        <p>
          {recommendation.score}/100 deal score
          {recommendation.reason[0] ? ` · ${recommendation.reason[0]}` : ''}
        </p>
      </div>
      <a href={recommendation.url} target="_blank" rel="noreferrer">
        View Deal
      </a>
    </section>
  )
}

export function MetricCard({ label, value, detail, highlight }: { label: string; value: string; detail?: string; highlight?: boolean }) {
  return (
    <article className={highlight ? 'metric-card metric-card-highlight' : 'metric-card'}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <p>{detail}</p> : null}
    </article>
  )
}

export function MarketSummary({ comparison }: { comparison: ProductComparison }) {
  const currency = comparison.summary.currency
  return (
    <section className="metrics-grid" aria-label="Market overview">
      <MetricCard label="Lowest Price" value={formatMoney(comparison.summary.lowestPrice, currency)} detail="Best total cost found" highlight />
      <MetricCard label="Market Average" value={formatMoney(comparison.summary.averagePrice, currency)} detail="Average total cost" />
      <MetricCard label="Highest Price" value={formatMoney(comparison.summary.highestPrice, currency)} detail="Top of compared range" />
      <MetricCard
        label="Potential Saving"
        value={formatMoney(comparison.summary.potentialSavingVsAverage, currency)}
        detail="Average minus lowest total"
      />
    </section>
  )
}

export function PriceRange({ comparison }: { comparison: ProductComparison }) {
  const { lowestPrice, averagePrice, highestPrice, currency } = comparison.summary
  const range = Math.max(highestPrice - lowestPrice, 1)
  const averagePosition = Math.round(((averagePrice - lowestPrice) / range) * 100)

  return (
    <section className="panel price-range-panel">
      <div className="section-heading">
        <h2>Market Price Range</h2>
        <span>{comparison.priceAnalysis.marketPosition}</span>
      </div>
      <div className="range-values">
        <span>{formatCompactMoney(lowestPrice, currency)}</span>
        <span>{formatCompactMoney(highestPrice, currency)}</span>
      </div>
      <div className="range-track" aria-label="Market price range">
        <span className="range-dot range-dot-low" />
        <span className="range-dot range-dot-average" style={{ left: `${averagePosition}%` }} />
        <span className="range-dot range-dot-high" />
      </div>
      <div className="range-labels">
        <span>Lowest</span>
        <span>Average</span>
        <span>Highest</span>
      </div>
    </section>
  )
}

export function RecommendationsGrid({ comparison }: { comparison: ProductComparison }) {
  const items = [
    ['Best Overall', comparison.recommendations.bestOverall],
    ['Cheapest', comparison.recommendations.cheapest],
    ['Best Rated', comparison.recommendations.bestRated],
    ['Best Local', comparison.recommendations.bestLocal],
    ['Best Shipping', comparison.recommendations.bestShipping],
  ] as const

  return (
    <section className="recommendation-grid">
      {items.map(([label, recommendation]) => (
        <article className="recommendation-card" key={label}>
          <span className="badge">{label}</span>
          {recommendation ? (
            <>
              <strong>{recommendation.store}</strong>
              <p>{formatMoney(recommendation.totalPrice, recommendation.currency)}</p>
              <small>{recommendation.score}/100 · {recommendation.reason[0] ?? 'Recommended option'}</small>
            </>
          ) : (
            <>
              <strong>Not available</strong>
              <p>No matching offer in this result.</p>
            </>
          )}
        </article>
      ))}
    </section>
  )
}

export function OfferFiltersBar({
  filters,
  countries,
  stores,
  onChange,
}: {
  filters: OfferFilters
  countries: Array<{ countryCode: string; country: string }>
  stores: string[]
  onChange: (filters: OfferFilters) => void
}) {
  return (
    <div className="filters" aria-label="Offer filters">
      <select value={filters.countryCode} onChange={(event) => onChange({ ...filters, countryCode: event.target.value })}>
        <option value="ALL">All countries</option>
        {countries.map((country) => (
          <option key={country.countryCode} value={country.countryCode}>
            {country.country}
          </option>
        ))}
      </select>
      <select value={filters.store} onChange={(event) => onChange({ ...filters, store: event.target.value })}>
        <option value="ALL">All stores</option>
        {stores.map((store) => (
          <option key={store} value={store}>
            {store}
          </option>
        ))}
      </select>
      <select value={filters.minRating} onChange={(event) => onChange({ ...filters, minRating: Number(event.target.value) })}>
        <option value={0}>Any rating</option>
        <option value={4}>4.0+</option>
        <option value={4.3}>4.3+</option>
        <option value={4.6}>4.6+</option>
      </select>
      <select value={filters.availability} onChange={(event) => onChange({ ...filters, availability: event.target.value })}>
        <option value="ALL">Any availability</option>
        <option value="available">Available</option>
        <option value="verify">Verify stock</option>
      </select>
      <select value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value })}>
        <option value="recommended">Recommended</option>
        <option value="lowest-total">Lowest total price</option>
        <option value="highest-rating">Highest rating</option>
        <option value="lowest-shipping">Lowest shipping</option>
        <option value="biggest-saving">Biggest saving</option>
      </select>
    </div>
  )
}

export function CountryTabs({
  countries,
  selected,
  onSelect,
}: {
  countries: Array<{ countryCode: string; country: string }>
  selected: string
  onSelect: (countryCode: string) => void
}) {
  return (
    <div className="country-tabs" role="tablist" aria-label="Countries">
      <button className={selected === 'ALL' ? 'active' : ''} type="button" onClick={() => onSelect('ALL')}>
        All
      </button>
      {countries.map((country) => (
        <button
          className={selected === country.countryCode ? 'active' : ''}
          key={country.countryCode}
          type="button"
          onClick={() => onSelect(country.countryCode)}
        >
          {country.country}
        </button>
      ))}
    </div>
  )
}

export function DealScoreBadge({ offer }: { offer: ProductComparisonOffer }) {
  return (
    <span className={`score score-${scoreTone(offer.dealScore.score)}`}>
      {offer.dealScore.score}/100 <small>{offer.dealScore.label}</small>
    </span>
  )
}

export function OfferTable({
  offers,
  onSelect,
}: {
  offers: ProductComparisonOffer[]
  onSelect: (offer: ProductComparisonOffer) => void
}) {
  if (!offers.length) {
    return <EmptyState title="No offers match these filters" message="Try another country, rating, store, or availability filter." />
  }

  return (
    <section className="panel offers-panel">
      <div className="section-heading">
        <h2>Compare Stores</h2>
        <span>{offers.length} offers</span>
      </div>
      <div className="offer-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Store</th>
              <th>Price</th>
              <th>Shipping</th>
              <th>Total</th>
              <th>Rating</th>
              <th>Availability</th>
              <th>Deal Score</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id} className={offer.isCheapest ? 'is-cheapest' : undefined}>
                <td>
                  <div className="store-cell">
                    <StoreLogo offer={offer} />
                    <ProductImage imageUrl={offer.imageUrl} name={offer.title} className="offer-thumb" />
                    <div>
                      <strong>{offer.store}</strong>
                      <span>{offer.country ?? offer.region ?? 'Global'}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <strong>{formatMoney(offer.pricing.original.amount, offer.pricing.original.currency)}</strong>
                  <span>Product price</span>
                </td>
                <td>{formatMoney(offer.pricing.shipping.amount, offer.pricing.shipping.currency)}</td>
                <td>
                  <strong>{formatMoney(offer.pricing.converted.total, offer.pricing.converted.currency)}</strong>
                  <span>{formatMoney(offer.pricing.total.amount, offer.pricing.total.currency)} external total</span>
                </td>
                <td>{offer.rating ? offer.rating.toFixed(1) : 'N/A'}</td>
                <td>{offer.availability ?? 'Verify with seller'}</td>
                <td>
                  <DealScoreBadge offer={offer} />
                </td>
                <td>
                  <button type="button" onClick={() => onSelect(offer)}>
                    Details
                  </button>
                  <a href={offer.url} target="_blank" rel="noreferrer">
                    View Deal
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="offer-cards">
        {offers.map((offer) => (
          <article className="offer-card" key={offer.id}>
            <div>
              <span className="store-card-title">
                <StoreLogo offer={offer} />
                <strong>{offer.store}</strong>
              </span>
              <span>{offer.isCheapest ? 'Best Price' : offer.country ?? offer.region ?? 'Global'}</span>
            </div>
            <ProductImage imageUrl={offer.imageUrl} name={offer.title} className="offer-card-image" />
            <h3>{formatMoney(offer.pricing.converted.total, offer.pricing.converted.currency)} total</h3>
            <p>
              {formatMoney(offer.pricing.converted.productPrice, offer.pricing.converted.currency)} product +{' '}
              {formatMoney(offer.pricing.converted.shipping, offer.pricing.converted.currency)} shipping
            </p>
            <p>
              {offer.rating ? `${offer.rating.toFixed(1)} rating` : 'Rating not available'} · {offer.availability ?? 'Verify stock'}
            </p>
            <DealScoreBadge offer={offer} />
            <div className="card-actions">
              <button type="button" onClick={() => onSelect(offer)}>
                Details
              </button>
              <a href={offer.url} target="_blank" rel="noreferrer">
                View Deal
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export function RegionalComparison({ comparison }: { comparison: ProductComparison }) {
  return (
    <section className="panel regional-panel">
      <div className="section-heading">
        <h2>Regional Prices</h2>
        <span>{comparison.regionalAnalysis.length} markets</span>
      </div>
      <div className="regional-grid">
        {comparison.regionalAnalysis.map((region) => (
          <article key={region.countryCode}>
            <strong>{region.country}</strong>
            <span>{region.offerCount} offers</span>
            <p>{formatMoney(region.lowestPrice, comparison.summary.currency)} lowest</p>
            <small>{formatMoney(region.averagePrice, comparison.summary.currency)} average</small>
          </article>
        ))}
      </div>
    </section>
  )
}

export function ReportSummary({ comparison }: { comparison: ProductComparison }) {
  return (
    <section className="panel report-panel">
      <div className="section-heading">
        <h2>Price Lens Report</h2>
        <span>{comparison.report.confidence}/100 confidence</span>
      </div>
      <div className="report-body">
        <span className={`recommendation recommendation-${comparison.report.recommendation.toLowerCase()}`}>
          {comparison.report.recommendation}
        </span>
        <h3>{comparison.report.headline}</h3>
        <p>{comparison.report.summary}</p>
        <div className="report-columns">
          <div>
            <strong>Why we recommend it</strong>
            <ul>
              {comparison.report.highlights.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div>
            <strong>Things to verify</strong>
            <ul>
              {comparison.report.warnings.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export function WarningCard({ comparison }: { comparison: ProductComparison }) {
  if (!comparison.riskAnalysis.hasWarnings) return null
  return (
    <section className="warning-card">
      <strong>Review before buying</strong>
      {comparison.riskAnalysis.warnings.map((warning) => (
        <p key={warning.type}>{warning.message}</p>
      ))}
    </section>
  )
}

export function OfferDetailDrawer({
  offer,
  onClose,
}: {
  offer: ProductComparisonOffer | null
  onClose: () => void
}) {
  if (!offer) return null

  return (
    <div className="drawer-backdrop" role="presentation" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`${offer.store} offer details`} onClick={(event) => event.stopPropagation()}>
        <header>
          <div>
            <span className="eyebrow">{offer.country ?? offer.region ?? 'External store'}</span>
            <h2>{offer.store}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close offer details">
            Close
          </button>
        </header>
        <h3>{offer.title}</h3>
        <ProductImage imageUrl={offer.imageUrl} name={offer.title} className="drawer-product-image" />
        <div className="drawer-store-visual">
          <StoreLogo offer={offer} />
          <div>
            <strong>{offer.store}</strong>
            <span>{offer.country ?? offer.region ?? 'External marketplace'}</span>
          </div>
        </div>
        <dl>
          <div>
            <dt>Product price</dt>
            <dd>{formatMoney(offer.pricing.converted.productPrice, offer.pricing.converted.currency)}</dd>
          </div>
          <div>
            <dt>Shipping</dt>
            <dd>{formatMoney(offer.pricing.converted.shipping, offer.pricing.converted.currency)}</dd>
          </div>
          <div>
            <dt>Total</dt>
            <dd>{formatMoney(offer.pricing.converted.total, offer.pricing.converted.currency)}</dd>
          </div>
          <div>
            <dt>Rating</dt>
            <dd>{offer.rating ? offer.rating.toFixed(1) : 'Not available'}</dd>
          </div>
          <div>
            <dt>Availability</dt>
            <dd>{offer.availability ?? 'Verify with seller'}</dd>
          </div>
          <div>
            <dt>Match confidence</dt>
            <dd>{offer.match.confidence}/100 · {offer.match.status}</dd>
          </div>
        </dl>
        <section>
          <strong>Why this deal?</strong>
          <ul>
            {offer.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        </section>
        <section>
          <strong>Warnings</strong>
          <ul>
            {[...offer.warnings, ...offer.match.warnings].map((warning) => (
              <li key={warning}>{warning}</li>
            ))}
          </ul>
        </section>
        <a className="drawer-cta" href={offer.url} target="_blank" rel="noreferrer">
          Visit Store
        </a>
      </aside>
    </div>
  )
}

function ProductImage({ imageUrl, name, className }: { imageUrl?: string; name: string; className: string }) {
  return (
    <img
      className={className}
      src={imageUrl || heroImage}
      alt={imageUrl ? name : ''}
      aria-hidden={imageUrl ? undefined : true}
      loading="lazy"
    />
  )
}

export function HeroArtwork() {
  return (
    <div className="hero-artwork" aria-hidden="true">
      <img src={heroImage} alt="" />
      <div className="hero-artwork-card hero-artwork-card-top">
        <span>Market average</span>
        <strong>NPR</strong>
      </div>
      <div className="hero-artwork-card hero-artwork-card-bottom">
        <span>Deal score</span>
        <strong>92</strong>
      </div>
    </div>
  )
}

export function HistoryPlaceholder({ productName }: { productName: string }) {
  return (
    <section className="panel placeholder-panel">
      <div className="section-heading">
        <h2>Price History</h2>
        <span>Not available</span>
      </div>
      <p>Historical price tracking is not available for {productName} yet.</p>
      <button type="button">Track Price</button>
    </section>
  )
}

export function SkeletonDashboard() {
  return (
    <section className="skeleton-stack" aria-label="Loading Price Lens dashboard">
      <div className="skeleton skeleton-hero" />
      <div className="skeleton-grid">
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton skeleton-table" />
    </section>
  )
}

export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <section className="empty-state">
      <h2>{title}</h2>
      <p>{message}</p>
    </section>
  )
}

export function ErrorState({ message }: { message: string }) {
  return (
    <section className="empty-state error-state">
      <h2>Comparison unavailable</h2>
      <p>{message}</p>
    </section>
  )
}

function scoreTone(score: number): string {
  if (score >= 90) return 'excellent'
  if (score >= 75) return 'good'
  if (score >= 60) return 'fair'
  return 'weak'
}

function StoreLogo({ offer }: { offer: ProductComparisonOffer }) {
  const imageUrl = faviconUrl(offer.url)
  return imageUrl ? (
    <img className="store-logo" src={imageUrl} alt="" aria-hidden="true" loading="lazy" />
  ) : (
    <span className="store-logo store-logo-fallback" aria-hidden="true">
      {offer.store.slice(0, 1).toUpperCase()}
    </span>
  )
}

function faviconUrl(url: string): string | null {
  try {
    const hostname = new URL(url, window.location.origin).hostname
    if (!hostname || hostname === window.location.hostname) return null
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=64`
  } catch {
    return null
  }
}
