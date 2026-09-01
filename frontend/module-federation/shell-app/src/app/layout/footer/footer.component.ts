import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="app-footer">
      <div class="footer-inner">
        <div class="footer-grid">
          <div class="footer-brand">
            <a class="brand-mark" routerLink="/">
              <span class="brand-icon"><i class="bi bi-bag-check"></i></span>
              <span class="brand-text">
                <strong>CommerceOS</strong>
                <small>API connected storefront</small>
              </span>
            </a>
            <p class="footer-tagline">Full-featured ecommerce platform powered by NestJS REST API with modular architecture.</p>
            <div class="footer-social">
              <a href="#" aria-label="GitHub"><i class="bi bi-github"></i></a>
              <a href="#" aria-label="Twitter"><i class="bi bi-twitter-x"></i></a>
              <a href="#" aria-label="YouTube"><i class="bi bi-youtube"></i></a>
            </div>
          </div>

          <div class="footer-links">
            <h4>Shop</h4>
            <a routerLink="/products">All Products</a>
            <a routerLink="/products" [queryParams]="{ sortBy: 'price', sortOrder: 'asc' }">Price: Low to High</a>
            <a routerLink="/products" [queryParams]="{ sortBy: 'price', sortOrder: 'desc' }">Price: High to Low</a>
            <a routerLink="/products" [queryParams]="{ sortBy: 'createdAt', sortOrder: 'desc' }">New Arrivals</a>
          </div>

          <div class="footer-links">
            <h4>Account</h4>
            <a routerLink="/auth/login">Sign In</a>
            <a routerLink="/auth/register">Register</a>
            <a routerLink="/orders">Order History</a>
            <a routerLink="/wishlist">Wishlist</a>
          </div>

          <div class="footer-links">
            <h4>Support</h4>
            <a href="#">Help Center</a>
            <a href="#">Shipping Info</a>
            <a href="#">Returns & Exchanges</a>
            <a href="#">Contact Us</a>
          </div>
        </div>

        <div class="footer-bottom">
          <span>&copy; {{ currentYear }} CommerceOS. All rights reserved.</span>
          <div class="footer-bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <span class="footer-tech">Built with Angular + NestJS</span>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: `
    .footer-inner {
      max-width: 1480px;
      margin: 0 auto;
    }

    .footer-grid {
      display: grid;
      grid-template-columns: 1.5fr repeat(3, 1fr);
      gap: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--color-border);
    }

    .footer-brand .brand-mark {
      display: inline-flex;
      align-items: center;
      gap: 0.6rem;
      margin-bottom: 0.85rem;
    }

    .footer-brand .brand-icon {
      display: grid;
      width: 2rem;
      height: 2rem;
      place-items: center;
      border-radius: var(--radius-md);
      background: linear-gradient(135deg, var(--color-primary), #24786d);
      color: #fff;
      font-size: 0.85rem;
    }

    .footer-brand .brand-text strong {
      display: block;
      font-size: 0.95rem;
      line-height: 1.1;
    }

    .footer-brand .brand-text small {
      display: block;
      color: var(--color-text-muted);
      font-size: 0.68rem;
      line-height: 1.1;
      margin-top: 0.1rem;
    }

    .footer-tagline {
      color: var(--color-text-muted);
      font-size: 0.85rem;
      line-height: 1.55;
      max-width: 20rem;
    }

    .footer-social {
      display: flex;
      gap: 0.5rem;
    }

    .footer-social a {
      display: grid;
      width: 2rem;
      height: 2rem;
      place-items: center;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      color: var(--color-text-muted);
      transition: all 150ms ease;
    }

    .footer-social a:hover {
      color: var(--color-primary);
      border-color: var(--color-primary);
      background: var(--color-surface-muted);
    }

    .footer-links {
      display: grid;
      gap: 0.55rem;
    }

    .footer-links h4 {
      margin: 0 0 0.35rem;
      color: var(--color-text-primary);
      font-size: 0.82rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .footer-links a {
      color: var(--color-text-muted);
      font-size: 0.85rem;
      font-weight: 600;
      transition: color 150ms ease;
    }

    .footer-links a:hover {
      color: var(--color-primary);
    }

    .footer-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      padding-top: 1.25rem;
      color: var(--color-text-muted);
      font-size: 0.78rem;
    }

    .footer-bottom-links {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .footer-bottom-links a {
      color: var(--color-text-muted);
      transition: color 150ms ease;
    }

    .footer-bottom-links a:hover {
      color: var(--color-primary);
    }

    .footer-tech {
      color: var(--color-text-muted);
      opacity: 0.6;
    }

    @media (max-width: 900px) {
      .footer-grid {
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
      }

      .footer-brand {
        grid-column: 1 / -1;
      }
    }

    @media (max-width: 560px) {
      .footer-grid {
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      .footer-bottom {
        flex-direction: column;
        gap: 0.5rem;
        text-align: center;
      }

      .footer-bottom-links {
        flex-wrap: wrap;
        justify-content: center;
        gap: 0.75rem;
      }
    }
  `,
})
export class FooterComponent {
  readonly currentYear = new Date().getFullYear();
}
