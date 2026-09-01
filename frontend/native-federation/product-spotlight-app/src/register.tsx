import { createRoot, Root } from 'react-dom/client';
import { ProductSpotlight } from './ProductSpotlight';
import { Product } from './types';

const DEFAULT_TAG_NAME = 'product-spotlight-widget';

class ProductSpotlightElement extends HTMLElement {
  static observedAttributes = ['api-base-url', 'heading', 'product-url-prefix'];

  private readonly mountPoint: HTMLDivElement;
  private root?: Root;

  constructor() {
    super();
    const shadow = this.attachShadow({ mode: 'open' });
    this.mountPoint = document.createElement('div');
    shadow.appendChild(this.mountPoint);
  }

  connectedCallback(): void {
    this.render();
  }

  disconnectedCallback(): void {
    this.root?.unmount();
    this.root = undefined;
  }

  attributeChangedCallback(): void {
    if (this.isConnected) {
      this.render();
    }
  }

  private render(): void {
    this.root ??= createRoot(this.mountPoint);
    this.root.render(
      <ProductSpotlight
        apiBaseUrl={this.apiBaseUrl}
        heading={this.heading}
        productUrlPrefix={this.productUrlPrefix}
        onProductSelect={(product) => this.emitProductSelect(product)}
        onViewAll={() => this.emitViewAll()}
      />,
    );
  }

  private get apiBaseUrl(): string {
    return this.getAttribute('api-base-url') ?? 'http://localhost:3000/api/v1';
  }

  private get heading(): string {
    return this.getAttribute('heading') ?? 'React product spotlight';
  }

  private get productUrlPrefix(): string {
    return this.getAttribute('product-url-prefix') ?? '/products';
  }

  private emitProductSelect(product: Product): void {
    this.dispatchEvent(
      new CustomEvent('product-spotlight-select', {
        bubbles: true,
        composed: true,
        detail: {
          id: product.id,
          slug: product.slug,
          name: product.name,
        },
      }),
    );
  }

  private emitViewAll(): void {
    this.dispatchEvent(
      new CustomEvent('product-spotlight-view-all', {
        bubbles: true,
        composed: true,
      }),
    );
  }
}

export function registerProductSpotlightElement(tagName = DEFAULT_TAG_NAME): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ProductSpotlightElement);
  }
}

registerProductSpotlightElement();
