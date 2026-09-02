import { DEFAULT_PRODUCT_SPOTLIGHT_TAG_NAME, ProductSpotlightElement } from './product-spotlight-element';

export function registerProductSpotlightElement(tagName = DEFAULT_PRODUCT_SPOTLIGHT_TAG_NAME): void {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, ProductSpotlightElement);
  }
}

registerProductSpotlightElement();

export { DEFAULT_PRODUCT_SPOTLIGHT_TAG_NAME, ProductSpotlightElement };
