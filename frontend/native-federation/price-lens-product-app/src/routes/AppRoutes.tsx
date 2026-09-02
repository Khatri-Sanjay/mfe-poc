import { Navigate, Route, Routes } from 'react-router-dom'
import PriceLensPage from '../pages/PriceLensPage'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<PriceLensPage />} />
      <Route path="/search/:query" element={<PriceLensPage />} />
      <Route path="/price-lens" element={<PriceLensPage />} />
      <Route path="/price-lens/search/:query" element={<PriceLensPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
