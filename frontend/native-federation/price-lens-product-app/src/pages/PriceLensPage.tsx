import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { priceLensApi } from '../api/priceLensApi'
import {
  BestDealCard,
  CountryTabs,
  EmptyState,
  ErrorState,
  HistoryPlaceholder,
  HeroArtwork,
  MarketSummary,
  OfferDetailDrawer,
  OfferFiltersBar,
  OfferTable,
  PriceRange,
  ProductHeader,
  RecommendationsGrid,
  RegionalComparison,
  ReportSummary,
  SearchBar,
  SkeletonDashboard,
  WarningCard,
  type OfferFilters,
} from '../components/priceLensComponents'
import type { ProductComparison, ProductComparisonOffer } from '../types'

type SearchState =
  | { status: 'idle'; comparison: null; error: null }
  | { status: 'loading'; comparison: null; error: null }
  | { status: 'success'; comparison: ProductComparison; error: null }
  | { status: 'error'; comparison: null; error: string }

const popularSearches = ['Samsung Galaxy S24', 'iPhone 15 128GB', 'MacBook Air M3', 'Nike running shoes']

const defaultFilters: OfferFilters = {
  countryCode: 'ALL',
  minRating: 0,
  availability: 'ALL',
  store: 'ALL',
  sort: 'recommended',
}

function queryFromRoute(pathQuery: string | undefined, searchQuery: string | null): string {
  return decodeURIComponent(pathQuery ?? searchQuery ?? '').trim()
}

export default function PriceLensPage() {
  const params = useParams<{ query?: string; productId?: string }>()
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const activeQuery = queryFromRoute(params.query ?? params.productId, searchParams.get('q'))
  const [inputValue, setInputValue] = useState(activeQuery)
  const [searchState, setSearchState] = useState<SearchState>(
    activeQuery ? { status: 'loading', comparison: null, error: null } : { status: 'idle', comparison: null, error: null },
  )
  const [filters, setFilters] = useState(defaultFilters)
  const [selectedOffer, setSelectedOffer] = useState<ProductComparisonOffer | null>(null)

  useEffect(() => {
    if (!activeQuery) {
      return
    }

    let cancelled = false

    priceLensApi
      .searchProduct(activeQuery)
      .then((comparison) => {
        if (!cancelled) setSearchState({ status: 'success', comparison, error: null })
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setSearchState({
            status: 'error',
            comparison: null,
            error: error instanceof Error ? error.message : 'Unable to compare prices right now.',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [activeQuery])

  const comparison = searchState.comparison
  const pageMode = location.pathname.endsWith('/history')
    ? 'history'
    : location.pathname.endsWith('/analysis')
      ? 'analysis'
      : location.pathname.endsWith('/compare')
        ? 'compare'
        : 'overview'

  const countries = useMemo(() => comparison?.regionalAnalysis.map(({ countryCode, country }) => ({ countryCode, country })) ?? [], [comparison])
  const stores = useMemo(() => [...new Set(comparison?.offers.map((offer) => offer.store) ?? [])].sort(), [comparison])
  const filteredOffers = useMemo(() => filterOffers(comparison?.offers ?? [], filters, comparison), [comparison, filters])

  function submitSearch() {
    const nextQuery = inputValue.trim()
    setFilters(defaultFilters)
    setSearchState(nextQuery ? { status: 'loading', comparison: null, error: null } : { status: 'idle', comparison: null, error: null })
    navigate(nextQuery ? `/search?q=${encodeURIComponent(nextQuery)}` : '/')
  }

  function selectPopularSearch(query: string) {
    setInputValue(query)
    setFilters(defaultFilters)
    setSearchState({ status: 'loading', comparison: null, error: null })
    navigate(`/search?q=${encodeURIComponent(query)}`)
  }

  return (
    <main className="price-lens">
      <nav className="app-nav" aria-label="Price Lens navigation">
        <Link to="/">Price Lens</Link>
        <Link to="/watchlist">Watchlist</Link>
        <Link to="/alerts">Alerts</Link>
        <Link to="/settings">Settings</Link>
      </nav>

      {isUtilityRoute(location.pathname) ? (
        <UtilityRoute pathname={location.pathname} />
      ) : (
        <>
          <section className="search-panel">
            <div className="search-hero">
              <div className="search-copy">
                <span className="eyebrow">Product intelligence and price comparison</span>
                <h1>Understand the market before you buy.</h1>
                <p>Search any product and compare total cost, seller rating, availability, regional options, deal quality, and buying warnings.</p>
              </div>
              <HeroArtwork />
            </div>
            <SearchBar value={inputValue} loading={searchState.status === 'loading'} onChange={setInputValue} onSubmit={submitSearch} />
            <div className="quick-searches" aria-label="Popular searches">
              <span>Examples</span>
              {popularSearches.map((query) => (
                <button key={query} type="button" onClick={() => selectPopularSearch(query)}>
                  {query}
                </button>
              ))}
            </div>
          </section>

          {!activeQuery && (
            <EmptyState title="Search for a product" message="Try a model name, storage option, color, or marketplace-style product description." />
          )}
          {searchState.status === 'loading' && <SkeletonDashboard />}
          {searchState.status === 'error' && <ErrorState message={searchState.error} />}

          {comparison && searchState.status === 'success' && (
            <>
              <ProductHeader comparison={comparison} />
              <div className="route-tabs" role="tablist" aria-label="Product intelligence sections">
                <Link className={pageMode === 'overview' ? 'active' : ''} to={`/product/${encodeURIComponent(activeQuery)}`}>
                  Overview
                </Link>
                <Link className={pageMode === 'compare' ? 'active' : ''} to={`/product/${encodeURIComponent(activeQuery)}/compare`}>
                  Compare
                </Link>
                <Link className={pageMode === 'analysis' ? 'active' : ''} to={`/product/${encodeURIComponent(activeQuery)}/analysis`}>
                  Analysis
                </Link>
                <Link className={pageMode === 'history' ? 'active' : ''} to={`/product/${encodeURIComponent(activeQuery)}/history`}>
                  History
                </Link>
              </div>

              {pageMode === 'history' ? (
                <HistoryPlaceholder productName={comparison.product.name} />
              ) : pageMode === 'analysis' ? (
                <>
                  <BestDealCard recommendation={comparison.recommendations.bestOverall} />
                  <MarketSummary comparison={comparison} />
                  <ReportSummary comparison={comparison} />
                  <WarningCard comparison={comparison} />
                </>
              ) : (
                <>
                  <BestDealCard recommendation={comparison.recommendations.bestOverall} />
                  <MarketSummary comparison={comparison} />
                  {pageMode === 'overview' && (
                    <>
                      <PriceRange comparison={comparison} />
                      <RecommendationsGrid comparison={comparison} />
                    </>
                  )}
                  <section className="panel">
                    <CountryTabs
                      countries={countries}
                      selected={filters.countryCode}
                      onSelect={(countryCode) => setFilters((current) => ({ ...current, countryCode }))}
                    />
                    <OfferFiltersBar filters={filters} countries={countries} stores={stores} onChange={setFilters} />
                  </section>
                  <OfferTable offers={filteredOffers} onSelect={setSelectedOffer} />
                  {pageMode === 'overview' && (
                    <>
                      <RegionalComparison comparison={comparison} />
                      <ReportSummary comparison={comparison} />
                      <WarningCard comparison={comparison} />
                    </>
                  )}
                </>
              )}
              <OfferDetailDrawer offer={selectedOffer} onClose={() => setSelectedOffer(null)} />
            </>
          )}
        </>
      )}
    </main>
  )
}

function UtilityRoute({ pathname }: { pathname: string }) {
  if (pathname === '/watchlist') {
    return (
      <EmptyState
        title="Watchlist is ready for account integration"
        message="Saved products are not implemented yet because this app does not currently have authenticated user storage."
      />
    )
  }
  if (pathname === '/alerts') {
    return (
      <EmptyState
        title="Price alerts are not active yet"
        message="Alert rules need backend persistence and notification delivery before they can be enabled."
      />
    )
  }
  return (
    <EmptyState
      title="Settings"
      message="Country and currency preferences are currently read from configuration. User-specific preferences can be connected later."
    />
  )
}

function isUtilityRoute(pathname: string): boolean {
  return ['/watchlist', '/alerts', '/settings'].includes(pathname)
}

function filterOffers(offers: ProductComparisonOffer[], filters: OfferFilters, comparison: ProductComparison | null): ProductComparisonOffer[] {
  const filtered = offers.filter((offer) => {
    const availability = (offer.availability ?? '').toLowerCase()
    return (
      (filters.countryCode === 'ALL' || offer.countryCode === filters.countryCode) &&
      (filters.store === 'ALL' || offer.store === filters.store) &&
      (offer.rating ?? 0) >= filters.minRating &&
      (filters.availability === 'ALL' ||
        (filters.availability === 'available' ? availability.includes('available') || availability.includes('in stock') : true))
    )
  })

  return filtered.sort((a, b) => {
    if (filters.sort === 'lowest-total') return a.totalPriceNpr - b.totalPriceNpr
    if (filters.sort === 'highest-rating') return (b.rating ?? 0) - (a.rating ?? 0) || a.totalPriceNpr - b.totalPriceNpr
    if (filters.sort === 'lowest-shipping') return a.shippingCostNpr - b.shippingCostNpr || b.dealScore.score - a.dealScore.score
    if (filters.sort === 'biggest-saving') {
      const average = comparison?.summary.averagePrice ?? 0
      return average - b.totalPriceNpr - (average - a.totalPriceNpr)
    }
    return b.dealScore.score - a.dealScore.score || a.totalPriceNpr - b.totalPriceNpr
  })
}
