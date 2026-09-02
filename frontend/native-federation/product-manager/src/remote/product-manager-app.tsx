import { MemoryRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthBoundary } from '@/lib/auth/auth-boundary';
import { ProductListRemote } from './pages/product-list-remote';
import { ProductCreateRemote } from './pages/product-create-remote';
import { ProductEditRemote } from './pages/product-edit-remote';

export function ProductManagerRemote({ initialPath = '/products' }: { initialPath?: string }) {
  return (
    <div className="product-manager-root">
      <AuthBoundary>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<ProductListRemote />} />
            <Route path="/products/new" element={<ProductCreateRemote />} />
            <Route path="/products/:id/edit" element={<ProductEditRemote />} />
            <Route path="*" element={<Navigate to="/products" replace />} />
          </Routes>
        </MemoryRouter>
      </AuthBoundary>
    </div>
  );
}
