import { StrictMode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import App from './App';
import './index.css';

export interface PriceLensMountOptions {
  apiBaseUrl?: string;
  productId?: string;
}

export function mount(element: HTMLElement, options: PriceLensMountOptions = {}) {
  const root: Root = createRoot(element);

  root.render(
    <StrictMode>
      <App apiBaseUrl={options.apiBaseUrl} productId={options.productId} />
    </StrictMode>,
  );

  return {
    unmount: () => root.unmount(),
  };
}
