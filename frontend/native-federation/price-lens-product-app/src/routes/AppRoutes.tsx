import { Navigate, Route, Routes } from 'react-router-dom'
import PriceLensPage from '../pages/PriceLensPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PriceLensPage />} />
      <Route path="/search" element={<PriceLensPage />} />
      <Route path="/search/:query" element={<PriceLensPage />} />
      <Route path="/product/:productId" element={<PriceLensPage />} />
      <Route path="/product/:productId/compare" element={<PriceLensPage />} />
      <Route path="/product/:productId/history" element={<PriceLensPage />} />
      <Route path="/product/:productId/analysis" element={<PriceLensPage />} />
      <Route path="/watchlist" element={<PriceLensPage />} />
      <Route path="/alerts" element={<PriceLensPage />} />
      <Route path="/settings" element={<PriceLensPage />} />
      <Route path="/price-lens" element={<PriceLensPage />} />
      <Route path="/price-lens/search" element={<PriceLensPage />} />
      <Route path="/price-lens/search/:query" element={<PriceLensPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
