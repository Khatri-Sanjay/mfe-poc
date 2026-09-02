export const productSpotlightStyles = `
  :host {
    display: block;
    color: var(--color-text-primary, #10201d);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  * {
    box-sizing: border-box;
  }

  .spotlight-shell {
    display: grid;
    gap: 1rem;
    width: 100%;
  }

  .spotlight-heading {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 1rem;
  }

  .spotlight-heading h2,
  .spotlight-heading p {
    margin: 0;
  }

  .spotlight-heading h2 {
    font-size: clamp(1.35rem, 2vw, 1.9rem);
    line-height: 1.1;
  }

  .eyebrow {
    color: var(--color-primary, #2563eb);
    font-size: 0.72rem;
    font-weight: 950;
    letter-spacing: 0;
    text-transform: uppercase;
  }

  .text-button {
    border: 0;
    background: transparent;
    color: var(--color-primary, #2563eb);
    cursor: pointer;
    font: inherit;
    font-size: 0.9rem;
    font-weight: 850;
  }

  .spotlight-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(19rem, 0.95fr);
    gap: 1rem;
    align-items: stretch;
  }

  .hero-product,
  .mini-product,
  .message {
    border: 1px solid var(--color-border, #d7e1dc);
    border-radius: var(--radius-md, 0.5rem);
    background: var(--color-surface, #ffffff);
    color: inherit;
    box-shadow: var(--shadow-sm, 0 8px 24px rgba(15, 23, 42, 0.06));
  }

  .hero-product {
    position: relative;
    display: grid;
    min-height: 22rem;
    overflow: hidden;
    cursor: pointer;
    padding: 0;
    text-align: left;
  }

  .hero-product img {
    width: 100%;
    height: 100%;
    min-height: 22rem;
    object-fit: cover;
  }

  .deal-badge {
    position: absolute;
    top: 1rem;
    left: 1rem;
    border-radius: 999px;
    background: var(--color-secondary, #c88a2d);
    color: var(--color-badge-text, #1f2937);
    padding: 0.4rem 0.7rem;
    font-size: 0.78rem;
    font-weight: 950;
  }

  .hero-copy {
    position: absolute;
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    display: grid;
    gap: 0.25rem;
    border-radius: var(--radius-md, 0.5rem);
    background: rgba(255, 255, 255, 0.94);
    padding: 1rem;
  }

  .hero-copy small,
  .mini-product small {
    color: var(--color-text-muted, #6b7b86);
    font-size: 0.74rem;
    font-weight: 850;
  }

  .hero-copy strong {
    font-size: 1.25rem;
    line-height: 1.15;
  }

  .hero-copy span,
  .mini-product em {
    color: var(--color-primary, #2563eb);
    font-style: normal;
    font-weight: 900;
  }

  .product-strip {
    display: grid;
    gap: 0.75rem;
  }

  .mini-product {
    display: grid;
    grid-template-columns: 5.5rem minmax(0, 1fr);
    gap: 0.85rem;
    min-height: 6.2rem;
    overflow: hidden;
    padding: 0.65rem;
    text-decoration: none;
    transition:
      border-color 150ms ease,
      transform 150ms ease;
  }

  .mini-product:hover {
    border-color: var(--color-primary-border-strong, rgba(37, 99, 235, 0.32));
    transform: translateY(-1px);
  }

  .mini-product img {
    width: 5.5rem;
    height: 5rem;
    border-radius: var(--radius-sm, 0.35rem);
    object-fit: cover;
  }

  .mini-product span {
    display: grid;
    align-content: center;
    min-width: 0;
    gap: 0.2rem;
  }

  .mini-product strong {
    overflow: hidden;
    font-size: 0.92rem;
    line-height: 1.25;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .message {
    display: grid;
    gap: 0.35rem;
    min-height: 8rem;
    align-content: center;
    padding: 1.25rem;
  }

  .message span {
    color: var(--color-text-secondary, #475569);
  }

  .skeleton {
    border-radius: var(--radius-md, 0.5rem);
    background: linear-gradient(90deg, var(--color-skeleton-start, #eef3f1), var(--color-skeleton-mid, #f8faf9), var(--color-skeleton-start, #eef3f1));
    background-size: 200% 100%;
    animation: pulse 1.2s infinite;
  }

  .hero-skeleton {
    min-height: 22rem;
  }

  .row-skeleton {
    min-height: 6.2rem;
  }

  @keyframes pulse {
    to {
      background-position: -200% 0;
    }
  }

  @media (max-width: 900px) {
    .spotlight-layout {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 560px) {
    .spotlight-heading {
      align-items: start;
      flex-direction: column;
    }

    .hero-product,
    .hero-product img,
    .hero-skeleton {
      min-height: 18rem;
    }
  }
`;
