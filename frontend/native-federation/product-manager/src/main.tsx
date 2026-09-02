import { createRoot } from 'react-dom/client';
import { mergeProductManagerConfig } from '../src/lib/config/product-manager-config';
import { ProductManagerRemote } from '../src/remote/product-manager-app';
import '../src/remote/remote.css';

mergeProductManagerConfig({
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000',
  refreshEndpoint: import.meta.env.VITE_REFRESH_ENDPOINT ?? '/api/v1/auth/refresh',
  refreshTokenField: import.meta.env.VITE_REFRESH_TOKEN_FIELD ?? 'refreshToken',
  loginUrl: import.meta.env.VITE_LOGIN_URL ?? '',
  redirectOnMissingAuth: import.meta.env.VITE_REDIRECT_ON_MISSING_AUTH === 'true',
});

const root = document.getElementById('root');
if (!root) throw new Error('Remote development root element was not found.');
createRoot(root).render(<ProductManagerRemote />);
