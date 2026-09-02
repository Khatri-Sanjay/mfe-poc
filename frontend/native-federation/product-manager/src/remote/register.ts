import './remote.css';
import { ProductManagerElement } from './product-manager-element';

export const PRODUCT_MANAGER_ELEMENT = 'product-manager-mfe';

function ensureRemoteStylesheet() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('link[data-product-manager-remote-style]')) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = new URL('./register.css', import.meta.url).href;
  link.dataset.productManagerRemoteStyle = 'true';
  document.head.appendChild(link);
}

ensureRemoteStylesheet();

if (!customElements.get(PRODUCT_MANAGER_ELEMENT)) {
  customElements.define(PRODUCT_MANAGER_ELEMENT, ProductManagerElement);
}

export { ProductManagerElement };
