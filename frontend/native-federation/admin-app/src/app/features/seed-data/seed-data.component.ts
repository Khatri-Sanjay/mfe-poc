import { Component, inject } from '@angular/core';
import { SeedDataService, SeedStatus } from './seed-data.service';

@Component({
  selector: 'app-seed-data',
  template: `
    <div class="admin-page-content">
      <div class="seed-warning">
        <i class="bi bi-info-circle"></i>
        <div>
          <strong>Before seeding</strong>
          <p>Make sure you are logged in with an admin account that has the required permissions. Existing data with the same slugs/codes will not be duplicated.</p>
        </div>
      </div>

      <div class="seed-grid">
        @for (item of seedItems; track item.key) {
          <div class="seed-card" [class.loading]="item.key">
            <div class="seed-card-icon" [style.background]="item.color">
              <i class="bi" [class]="item.icon"></i>
            </div>
            <div class="seed-card-body">
              <strong>{{ item.title }}</strong>
              <span>{{ item.description }}</span>
              <span class="seed-card-count">{{ item.count }}</span>
            </div>
            <div class="seed-card-action">
              @switch (seedService.status()[item.key]) {
                @case ('loading') {
                  <button class="btn-secondary compact" disabled>
                    <i class="bi bi-arrow-repeat spin"></i> Seeding...
                  </button>
                }
                @case ('done') {
                  <button class="btn-secondary compact" disabled>
                    <i class="bi bi-check-lg"></i> Done
                  </button>
                }
                @case ('error') {
                  <button class="btn-secondary compact" (click)="seedService.seed(item.key)">
                    <i class="bi bi-arrow-clockwise"></i> Retry
                  </button>
                }
                @default {
                  <button class="btn-primary compact" (click)="seedService.seed(item.key)">
                    <i class="bi bi-database-fill-add"></i> Seed
                  </button>
                }
              }
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    :host { display: contents; }

    .seed-warning {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 0.75rem;
      align-items: start;
      border: 1px solid rgba(40, 95, 143, 0.2);
      border-radius: var(--radius-lg);
      background: #f3f9ff;
      padding: 1rem;
      color: var(--color-info);
    }

    .seed-warning i {
      margin-top: 0.15rem;
      font-size: 1.1rem;
    }

    .seed-warning strong {
      color: var(--color-text-primary);
      font-size: 0.9rem;
    }

    .seed-warning p {
      color: var(--color-text-secondary);
      font-size: 0.85rem;
      margin: 0.25rem 0 0;
    }

    .seed-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 28rem), 1fr));
      gap: 1rem;
    }

    .seed-card {
      display: grid;
      grid-template-columns: auto 1fr auto;
      gap: 1rem;
      align-items: center;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      background: #fff;
      padding: 1.25rem;
      box-shadow: var(--shadow-sm);
      transition: transform 160ms ease, box-shadow 160ms ease;
    }

    .seed-card:hover {
      transform: translateY(-1px);
      box-shadow: var(--shadow-md);
    }

    .seed-card-icon {
      display: grid;
      width: 3rem;
      height: 3rem;
      place-items: center;
      border-radius: var(--radius-md);
      color: #fff;
      font-size: 1.2rem;
    }

    .seed-card-body {
      display: grid;
      gap: 0.2rem;
      min-width: 0;
    }

    .seed-card-body strong {
      font-weight: 950;
      color: var(--color-text-primary);
    }

    .seed-card-body span {
      color: var(--color-text-muted);
      font-size: 0.85rem;
    }

    .seed-card-count {
      font-size: 0.78rem;
      font-weight: 800;
      color: var(--color-primary) !important;
    }

    .seed-card-action {
      display: flex;
      gap: 0.5rem;
    }

    .spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    @media (max-width: 560px) {
      .seed-card {
        grid-template-columns: auto 1fr;
      }

      .seed-card-action {
        grid-column: 1 / -1;
        justify-content: flex-end;
      }
    }
  `,
})
export class SeedDataComponent {
  seedService = inject(SeedDataService);

  seedItems: { key: keyof SeedStatus; title: string; description: string; icon: string; color: string; count: string }[] = [
    {
      key: 'categories',
      title: 'Categories',
      description: 'Electronics, Phones, Laptops, Tablets, Accessories, Audio, Wearables, Cameras, Gaming, Home & Kitchen',
      icon: 'bi-tags',
      color: 'linear-gradient(135deg, #12473f, #24786d)',
      count: '10 categories',
    },
    {
      key: 'brands',
      title: 'Brands',
      description: 'Apple, Samsung, Google, Sony, Microsoft, Logitech, JBL, Dyson',
      icon: 'bi-award',
      color: 'linear-gradient(135deg, #c88a2d, #e6a94a)',
      count: '8 brands',
    },
    {
      key: 'products',
      title: 'Products',
      description: '17 products with real images, variants, pricing, and stock levels across all categories',
      icon: 'bi-box-seam',
      color: 'linear-gradient(135deg, #0f7a4f, #15a06a)',
      count: '17 products',
    },
    {
      key: 'users',
      title: 'Users',
      description: '2 admins + 8 customers with varied statuses (active, inactive, suspended)',
      icon: 'bi-people',
      color: 'linear-gradient(135deg, #285f8f, #3a7bb8)',
      count: '10 users',
    },
    {
      key: 'shipping',
      title: 'Shipping Methods',
      description: 'Standard, Express, Free, and Overnight shipping options',
      icon: 'bi-truck',
      color: 'linear-gradient(135deg, #7c3aed, #9b6dff)',
      count: '4 methods',
    },
    {
      key: 'coupons',
      title: 'Coupons',
      description: 'WELCOME10, SAVE20, FLAT50, SUMMER25, VIP100 discount codes',
      icon: 'bi-percent',
      color: 'linear-gradient(135deg, #b42318, #d94a3e)',
      count: '5 coupons',
    },
  ];

  isAnyLoading(): boolean {
    const s = this.seedService.status();
    return Object.values(s).some((v) => v === 'loading');
  }
}
