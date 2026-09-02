import { createRoot, type Root } from 'react-dom/client';
import { mergeProductManagerConfig } from '@/lib/config/product-manager-config';
import { ProductManagerRemote } from './product-manager-app';

export class ProductManagerElement extends HTMLElement {
  private root: Root | null = null;
  private mountPoint: HTMLDivElement | null = null;

  static get observedAttributes() {
    return ['initial-path'];
  }

  connectedCallback() {
    if (this.root) return;

    mergeProductManagerConfig({
      apiBaseUrl: this.getAttribute('api-base-url') ?? undefined,
      refreshEndpoint: this.getAttribute('refresh-endpoint') ?? undefined,
      refreshTokenField: this.getAttribute('refresh-token-field') ?? undefined,
      loginUrl: this.getAttribute('login-url') ?? undefined,
      redirectOnMissingAuth: this.hasAttribute('redirect-on-missing-auth')
        ? this.getAttribute('redirect-on-missing-auth') === 'true'
        : undefined,
    });

    this.mountPoint = document.createElement('div');
    this.mountPoint.className = 'product-manager-mount';
    this.appendChild(this.mountPoint);
    this.root = createRoot(this.mountPoint);
    this.renderRemote();
  }

  attributeChangedCallback() {
    this.renderRemote();
  }

  disconnectedCallback() {
    this.root?.unmount();
    this.root = null;
    this.mountPoint?.remove();
    this.mountPoint = null;
  }

  private renderRemote() {
    if (!this.root) return;
    this.root.render(<ProductManagerRemote key={this.getAttribute('initial-path') ?? '/products'} initialPath={this.getAttribute('initial-path') ?? '/products'} />);
  }
}
