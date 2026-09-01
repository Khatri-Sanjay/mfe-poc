import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ToastService } from '../../shared/components/toast/toast.service';
import { ApiResponse } from '../../core/models/auth.model';
import { Category, Brand } from '../../core/models/product.model';

export interface SeedStatus {
  categories: 'idle' | 'loading' | 'done' | 'error';
  brands: 'idle' | 'loading' | 'done' | 'error';
  products: 'idle' | 'loading' | 'done' | 'error';
  users: 'idle' | 'loading' | 'done' | 'error';
  shipping: 'idle' | 'loading' | 'done' | 'error';
  coupons: 'idle' | 'loading' | 'done' | 'error';
}

@Injectable({ providedIn: 'root' })
export class SeedDataService {
  private http = inject(HttpClient);
  private toast = inject(ToastService);

  status = signal<SeedStatus>({
    categories: 'idle',
    brands: 'idle',
    products: 'idle',
    users: 'idle',
    shipping: 'idle',
    coupons: 'idle',
  });

  private api = environment.apiUrl;

  private setStatus(key: keyof SeedStatus, state: 'idle' | 'loading' | 'done' | 'error') {
    this.status.update((s) => ({ ...s, [key]: state }));
  }

  private seedCategories() {
    this.setStatus('categories', 'loading');

    const categories = [
      {
        name: 'Electronics',
        description: 'Devices, accessories, and consumer electronics.',
        sortOrder: 10,
      },
      { name: 'Phones', description: 'Smartphones and mobile devices.', sortOrder: 20 },
      {
        name: 'Laptops',
        description: 'Notebooks, ultrabooks, and portable computers.',
        sortOrder: 30,
      },
      { name: 'Tablets', description: 'iPads, Android tablets, and e-readers.', sortOrder: 40 },
      {
        name: 'Accessories',
        description: 'Chargers, cases, cables, and everyday add-ons.',
        sortOrder: 50,
      },
      {
        name: 'Audio',
        description: 'Headphones, earbuds, speakers, and sound systems.',
        sortOrder: 60,
      },
      {
        name: 'Wearables',
        description: 'Smartwatches, fitness trackers, and wearable tech.',
        sortOrder: 70,
      },
      {
        name: 'Cameras',
        description: 'Digital cameras, action cameras, and lenses.',
        sortOrder: 80,
      },
      {
        name: 'Gaming',
        description: 'Consoles, controllers, and gaming accessories.',
        sortOrder: 90,
      },
      {
        name: 'Home & Kitchen',
        description: 'Smart home devices, appliances, and kitchen gadgets.',
        sortOrder: 100,
      },
    ];

    const requests = categories.map((c) =>
      this.http.post<ApiResponse<Category>>(`${this.api}/admin/categories`, {
        ...c,
        isActive: true,
      }),
    );

    let completed = 0;
    let failed = 0;

    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed + failed === categories.length) {
            this.setStatus('categories', failed > 0 ? 'error' : 'done');
            this.toast.success(
              'Categories seeded',
              `${completed} created, ${failed} failed (may already exist).`,
            );
          }
        },
        error: () => {
          failed++;
          if (completed + failed === categories.length) {
            this.setStatus('categories', failed > 0 ? 'error' : 'done');
            this.toast.success(
              'Categories seeded',
              `${completed} created, ${failed} skipped (already exist).`,
            );
          }
        },
      });
    });
  }

  private seedBrands() {
    this.setStatus('brands', 'loading');

    const brands = [
      {
        name: 'Apple',
        description: 'Consumer technology products including iPhone, Mac, and iPad.',
        websiteUrl: 'https://www.apple.com',
      },
      {
        name: 'Samsung',
        description: 'Electronics manufacturer known for Galaxy devices and displays.',
        websiteUrl: 'https://www.samsung.com',
      },
      {
        name: 'Google',
        description: 'Technology company behind Pixel, Nest, and Android.',
        websiteUrl: 'https://www.google.com',
      },
      {
        name: 'Sony',
        description: 'Electronics and entertainment company behind PlayStation and Xperia.',
        websiteUrl: 'https://www.sony.com',
      },
      {
        name: 'Microsoft',
        description: 'Software and hardware company behind Surface, Xbox, and Windows.',
        websiteUrl: 'https://www.microsoft.com',
      },
      {
        name: 'Logitech',
        description: 'Computer peripherals and accessories manufacturer.',
        websiteUrl: 'https://www.logitech.com',
      },
      {
        name: 'JBL',
        description: 'Audio equipment manufacturer specializing in speakers and headphones.',
        websiteUrl: 'https://www.jbl.com',
      },
      {
        name: 'Dyson',
        description: 'Technology company known for vacuum cleaners and hair care.',
        websiteUrl: 'https://www.dyson.com',
      },
    ];

    const requests = brands.map((b) =>
      this.http.post<ApiResponse<Brand>>(`${this.api}/admin/brands`, {
        ...b,
        isActive: true,
      }),
    );

    let completed = 0;
    let failed = 0;

    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed + failed === brands.length) {
            this.setStatus('brands', failed > 0 ? 'error' : 'done');
            this.toast.success('Brands seeded', `${completed} created, ${failed} skipped.`);
          }
        },
        error: () => {
          failed++;
          if (completed + failed === brands.length) {
            this.setStatus('brands', failed > 0 ? 'error' : 'done');
            this.toast.success('Brands seeded', `${completed} created, ${failed} skipped.`);
          }
        },
      });
    });
  }

  private async seedProducts() {
    this.setStatus('products', 'loading');

    try {
      const [brandsRes, categoriesRes] = await Promise.all([
        this.http.get<ApiResponse<Brand[]>>(`${this.api}/brands`).toPromise(),
        this.http.get<ApiResponse<Category[]>>(`${this.api}/categories`).toPromise(),
      ]);

      const brands = brandsRes?.data ?? [];
      const categories = categoriesRes?.data ?? [];

      const findBrand = (name: string) => brands.find((b) => b.name === name)?.id;
      const findCategory = (name: string) => categories.find((c) => c.name === name)?.id;

      const appleId = findBrand('Apple');
      const samsungId = findBrand('Samsung');
      const googleId = findBrand('Google');
      const sonyId = findBrand('Sony');
      const microsoftId = findBrand('Microsoft');
      const logitechId = findBrand('Logitech');
      const jblId = findBrand('JBL');
      const dysonId = findBrand('Dyson');

      const phonesId = findCategory('Phones');
      const laptopsId = findCategory('Laptops');
      const tabletsId = findCategory('Tablets');
      const accessoriesId = findCategory('Accessories');
      const audioId = findCategory('Audio');
      const wearablesId = findCategory('Wearables');
      const camerasId = findCategory('Cameras');
      const gamingId = findCategory('Gaming');
      const homeId = findCategory('Home & Kitchen');
      const electronicsId = findCategory('Electronics');

      const products = [
        {
          name: 'iPhone 16 Pro',
          slug: 'iphone-16-pro',
          description:
            'The most powerful iPhone ever with the A18 Pro chip, a 48MP Fusion camera, and a titanium design. Features a 6.3-inch Super Retina XDR display with ProMotion and Always-On technology.',
          shortDescription: 'Apple flagship smartphone with A18 Pro chip and 48MP camera.',
          brandId: appleId,
          categoryIds: [phonesId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&h=800&fit=crop',
              altText: 'iPhone 16 Pro front view',
              sortOrder: 0,
              isPrimary: true,
            },
            {
              url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
              altText: 'iPhone 16 Pro camera detail',
              sortOrder: 1,
              isPrimary: false,
            },
          ],
          variants: [
            {
              sku: 'IP16PRO-256-BLACK',
              name: '256GB Black Titanium',
              price: '1799.00',
              compareAtPrice: '1899.00',
              currency: 'AUD',
              quantityOnHand: 45,
              options: { color: 'Black Titanium', storage: '256GB' },
            },
            {
              sku: 'IP16PRO-512-BLACK',
              name: '512GB Black Titanium',
              price: '2099.00',
              compareAtPrice: '2199.00',
              currency: 'AUD',
              quantityOnHand: 30,
              options: { color: 'Black Titanium', storage: '512GB' },
            },
            {
              sku: 'IP16PRO-256-WHITE',
              name: '256GB White Titanium',
              price: '1799.00',
              currency: 'AUD',
              quantityOnHand: 40,
              options: { color: 'White Titanium', storage: '256GB' },
            },
          ],
        },
        {
          name: 'iPhone 16',
          slug: 'iphone-16',
          description:
            'A powerful iPhone with the A18 chip, a 48MP camera system, and a 6.1-inch display. Designed for everyday performance with all-day battery life.',
          shortDescription: 'Everyday iPhone with A18 chip and 48MP camera.',
          brandId: appleId,
          categoryIds: [phonesId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1591337676887-a217a6c6eee4?w=800&h=800&fit=crop',
              altText: 'iPhone 16 in hand',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'IP16-128-BLACK',
              name: '128GB Black',
              price: '1399.00',
              currency: 'AUD',
              quantityOnHand: 60,
              options: { color: 'Black', storage: '128GB' },
            },
            {
              sku: 'IP16-128-PINK',
              name: '128GB Pink',
              price: '1399.00',
              currency: 'AUD',
              quantityOnHand: 35,
              options: { color: 'Pink', storage: '128GB' },
            },
          ],
        },
        {
          name: 'Samsung Galaxy S25 Ultra',
          slug: 'samsung-galaxy-s25-ultra',
          description:
            'Samsung flagship with Snapdragon 8 Elite, 200MP camera, S Pen, and a 6.9-inch Dynamic AMOLED 2X display. Titanium frame with AI-powered features.',
          shortDescription: 'Samsung flagship with 200MP camera and S Pen.',
          brandId: samsungId,
          categoryIds: [phonesId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&h=800&fit=crop',
              altText: 'Samsung Galaxy S25 Ultra',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'GS25U-256-TITANIUM',
              name: '256GB Titanium Silverblue',
              price: '1899.00',
              currency: 'AUD',
              quantityOnHand: 35,
              options: { color: 'Titanium Silverblue', storage: '256GB' },
            },
            {
              sku: 'GS25U-512-TITANIUM',
              name: '512GB Titanium Gray',
              price: '2199.00',
              currency: 'AUD',
              quantityOnHand: 20,
              options: { color: 'Titanium Gray', storage: '512GB' },
            },
          ],
        },
        {
          name: 'Google Pixel 9 Pro',
          slug: 'google-pixel-9-pro',
          description:
            'Google most advanced phone with Tensor G4, a 50MP triple camera system, and 7 years of updates. Features Gemini AI built-in.',
          shortDescription: 'Google flagship with Tensor G4 and Gemini AI.',
          brandId: googleId,
          categoryIds: [phonesId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop',
              altText: 'Google Pixel 9 Pro',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'GPIX9P-128-BLACK',
              name: '128GB Obsidian',
              price: '1349.00',
              currency: 'AUD',
              quantityOnHand: 40,
              options: { color: 'Obsidian', storage: '128GB' },
            },
            {
              sku: 'GPIX9P-256-PORCELAIN',
              name: '256GB Porcelain',
              price: '1499.00',
              currency: 'AUD',
              quantityOnHand: 25,
              options: { color: 'Porcelain', storage: '256GB' },
            },
          ],
        },
        {
          name: 'MacBook Air M4',
          slug: 'macbook-air-m4',
          description:
            'Impossibly thin with the M4 chip, up to 18 hours of battery life, and a stunning Liquid Retina display. Fanless design in a lightweight chassis.',
          shortDescription: 'Ultra-thin laptop with M4 chip and all-day battery.',
          brandId: appleId,
          categoryIds: [laptopsId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
              altText: 'MacBook Air M4 open',
              sortOrder: 0,
              isPrimary: true,
            },
            {
              url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
              altText: 'MacBook Air keyboard',
              sortOrder: 1,
              isPrimary: false,
            },
          ],
          variants: [
            {
              sku: 'MBA-M4-256-MIDNIGHT',
              name: '13" 8GB/256GB Midnight',
              price: '1599.00',
              currency: 'AUD',
              quantityOnHand: 50,
              options: { size: '13 inch', color: 'Midnight' },
            },
            {
              sku: 'MBA-M4-512-STARLIGHT',
              name: '15" 16GB/512GB Starlight',
              price: '2099.00',
              currency: 'AUD',
              quantityOnHand: 30,
              options: { size: '15 inch', color: 'Starlight' },
            },
          ],
        },
        {
          name: 'MacBook Pro 14" M4 Pro',
          slug: 'macbook-pro-14-m4-pro',
          description:
            'The most advanced Mac laptop ever with M4 Pro chip, up to 48GB unified memory, and a Liquid Retina XDR display. For demanding professional workflows.',
          shortDescription: 'Professional laptop with M4 Pro and XDR display.',
          brandId: appleId,
          categoryIds: [laptopsId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
              altText: 'MacBook Pro 14 inch',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'MBP14-M4P-512-SPACE',
              name: '14" M4 Pro 24GB/512GB Space Black',
              price: '2799.00',
              currency: 'AUD',
              quantityOnHand: 20,
              options: { chip: 'M4 Pro', color: 'Space Black' },
            },
            {
              sku: 'MBP14-M4P-1TB-SILVER',
              name: '14" M4 Pro 48GB/1TB Silver',
              price: '3499.00',
              currency: 'AUD',
              quantityOnHand: 15,
              options: { chip: 'M4 Pro', color: 'Silver' },
            },
          ],
        },
        {
          name: 'Samsung Galaxy Tab S10',
          slug: 'samsung-galaxy-tab-s10',
          description:
            'Premium Android tablet with a 12.4-inch Dynamic AMOLED 2X display, S Pen included, and DeX mode for desktop-like productivity.',
          shortDescription: 'Premium Android tablet with S Pen and AMOLED display.',
          brandId: samsungId,
          categoryIds: [tabletsId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop',
              altText: 'Samsung Galaxy Tab S10',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'GTAB-S10-256-GRA',
              name: '256GB Graphite',
              price: '1299.00',
              currency: 'AUD',
              quantityOnHand: 25,
              options: { color: 'Graphite', storage: '256GB' },
            },
          ],
        },
        {
          name: 'iPad Pro M4',
          slug: 'ipad-pro-m4',
          description:
            'The ultimate iPad with the M4 chip, a tandem OLED Liquid Retina XDR display, and support for Apple Pencil Pro. Ultra-thin and incredibly powerful.',
          shortDescription: 'Most powerful iPad with M4 chip and OLED display.',
          brandId: appleId,
          categoryIds: [tabletsId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop',
              altText: 'iPad Pro M4',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'IPADP-M4-256-SILVER',
              name: '11" 256GB Silver',
              price: '1599.00',
              currency: 'AUD',
              quantityOnHand: 30,
              options: { size: '11 inch', color: 'Silver' },
            },
            {
              sku: 'IPADP-M4-512-SPACE',
              name: '13" 512GB Space Black',
              price: '2199.00',
              currency: 'AUD',
              quantityOnHand: 20,
              options: { size: '13 inch', color: 'Space Black' },
            },
          ],
        },
        {
          name: 'AirPods Pro 3',
          slug: 'airpods-pro-3',
          description:
            'Active Noise Cancellation, Adaptive Audio, and a personalized spatial audio experience. USB-C charging with up to 6 hours of listening time.',
          shortDescription: 'Premium wireless earbuds with ANC and spatial audio.',
          brandId: appleId,
          categoryIds: [audioId, accessoriesId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=800&h=800&fit=crop',
              altText: 'AirPods Pro 3',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'AIRPODSP3-WHITE',
              name: 'AirPods Pro 3 White',
              price: '399.00',
              currency: 'AUD',
              quantityOnHand: 80,
              options: { color: 'White' },
            },
          ],
        },
        {
          name: 'Sony WH-1000XM6',
          slug: 'sony-wh-1000xm6',
          description:
            'Industry-leading noise cancellation with Auto NC Optimizer, 30-hour battery life, and LDAC Hi-Res Audio support. Multipoint connection for seamless switching.',
          shortDescription: 'Premium noise-cancelling headphones with 30hr battery.',
          brandId: sonyId,
          categoryIds: [audioId, accessoriesId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
              altText: 'Sony WH-1000XM6 headphones',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'SONY-WH1K-BLACK',
              name: 'WH-1000XM6 Black',
              price: '499.00',
              currency: 'AUD',
              quantityOnHand: 40,
              options: { color: 'Black' },
            },
            {
              sku: 'SONY-WH1K-SILVER',
              name: 'WH-1000XM6 Silver',
              price: '499.00',
              currency: 'AUD',
              quantityOnHand: 30,
              options: { color: 'Silver' },
            },
          ],
        },
        {
          name: 'Apple Watch Ultra 3',
          slug: 'apple-watch-ultra-3',
          description:
            'The most rugged and capable Apple Watch with a 49mm titanium case, precision dual-frequency GPS, and up to 36 hours of battery life.',
          shortDescription: 'Rugged titanium smartwatch with precision GPS.',
          brandId: appleId,
          categoryIds: [wearablesId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop',
              altText: 'Apple Watch Ultra 3',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'AWU3-49-NATURAL',
              name: '49mm Natural Titanium',
              price: '1299.00',
              currency: 'AUD',
              quantityOnHand: 25,
              options: { size: '49mm', color: 'Natural Titanium' },
            },
          ],
        },
        {
          name: 'JBL Charge 5',
          slug: 'jbl-charge-5',
          description:
            'Portable Bluetooth speaker with powerful JBL Pro Sound, IP67 waterproof and dustproof rating, and a built-in powerbank for charging devices.',
          shortDescription: 'Waterproof portable speaker with powerbank feature.',
          brandId: jblId,
          categoryIds: [audioId, accessoriesId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=800&fit=crop',
              altText: 'JBL Charge 5 speaker',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'JBL-CHG5-BLUE',
              name: 'Charge 5 Blue',
              price: '179.95',
              currency: 'AUD',
              quantityOnHand: 60,
              options: { color: 'Blue' },
            },
            {
              sku: 'JBL-CHG5-RED',
              name: 'Charge 5 Red',
              price: '179.95',
              currency: 'AUD',
              quantityOnHand: 45,
              options: { color: 'Red' },
            },
            {
              sku: 'JBL-CHG5-BLACK',
              name: 'Charge 5 Black',
              price: '179.95',
              currency: 'AUD',
              quantityOnHand: 70,
              options: { color: 'Black' },
            },
          ],
        },
        {
          name: 'Sony Alpha A7 IV',
          slug: 'sony-alpha-a7-iv',
          description:
            'Full-frame mirrorless camera with 33MP sensor, real-time eye AF, 4K 60p video, and advanced subject tracking. A versatile hybrid camera.',
          shortDescription: '33MP full-frame mirrorless camera with 4K video.',
          brandId: sonyId,
          categoryIds: [camerasId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&h=800&fit=crop',
              altText: 'Sony Alpha A7 IV camera',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'SONY-A7IV-BODY',
              name: 'A7 IV Body Only',
              price: '3499.00',
              currency: 'AUD',
              quantityOnHand: 15,
              options: { type: 'Body Only' },
            },
            {
              sku: 'SONY-A7IV-2870',
              name: 'A7 IV with 28-70mm Kit',
              price: '4199.00',
              currency: 'AUD',
              quantityOnHand: 10,
              options: { type: 'Kit Lens' },
            },
          ],
        },
        {
          name: 'Logitech MX Master 3S',
          slug: 'logitech-mx-master-3s',
          description:
            'Wireless performance mouse with MagSpeed scroll wheel, 8K DPI track-on-glass sensor, and quiet clicks. Connects to up to 3 devices.',
          shortDescription: 'Premium wireless mouse with MagSpeed scrolling.',
          brandId: logitechId,
          categoryIds: [accessoriesId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=800&h=800&fit=crop',
              altText: 'Logitech MX Master 3S',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'MX3S-GRAPHITE',
              name: 'MX Master 3S Graphite',
              price: '149.95',
              currency: 'AUD',
              quantityOnHand: 100,
              options: { color: 'Graphite' },
            },
            {
              sku: 'MX3S-PALE',
              name: 'MX Master 3S Pale Gray',
              price: '149.95',
              currency: 'AUD',
              quantityOnHand: 55,
              options: { color: 'Pale Gray' },
            },
          ],
        },
        {
          name: 'Xbox Series X',
          slug: 'xbox-series-x',
          description:
            'The fastest, most powerful Xbox ever. 12 teraflops of GPU power, true 4K gaming, 120fps, and quick resume for instant game switching.',
          shortDescription: 'Most powerful Xbox with 12 teraflops of GPU power.',
          brandId: microsoftId,
          categoryIds: [gamingId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1621259182978-fbf93132d53d?w=800&h=800&fit=crop',
              altText: 'Xbox Series X console',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'XSX-1TB-BLACK',
              name: 'Xbox Series X 1TB Black',
              price: '799.00',
              currency: 'AUD',
              quantityOnHand: 30,
              options: { color: 'Black', storage: '1TB' },
            },
          ],
        },
        {
          name: 'Dyson V15 Detect',
          slug: 'dyson-v15-detect',
          description:
            'Cordless vacuum with laser dust detection, piezo sensor that counts particles, and up to 60 minutes of runtime. LCD screen shows real-time data.',
          shortDescription: 'Cordless vacuum with laser dust detection.',
          brandId: dysonId,
          categoryIds: [homeId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=800&fit=crop',
              altText: 'Dyson V15 Detect vacuum',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'DYSON-V15-GOLD',
              name: 'V15 Detect Yellow/Nickel',
              price: '1099.00',
              currency: 'AUD',
              quantityOnHand: 20,
              options: { color: 'Yellow/Nickel' },
            },
          ],
        },
        {
          name: 'Nintendo Switch 2',
          slug: 'nintendo-switch-2',
          description:
            'The next generation of Nintendo gaming with an 8-inch LCD display, magnetic Joy-Cons, and backwards compatibility with Nintendo Switch games.',
          shortDescription: 'Next-gen Nintendo console with 8-inch display.',
          brandId: null,
          categoryIds: [gamingId, electronicsId].filter(Boolean),
          status: 'ACTIVE',
          images: [
            {
              url: 'https://images.unsplash.com/photo-1578303512597-81e6cc155b3e?w=800&h=800&fit=crop',
              altText: 'Nintendo Switch 2',
              sortOrder: 0,
              isPrimary: true,
            },
          ],
          variants: [
            {
              sku: 'NSW2-256-BLACK',
              name: 'Nintendo Switch 2 256GB',
              price: '649.95',
              currency: 'AUD',
              quantityOnHand: 50,
              options: { storage: '256GB' },
            },
          ],
        },
      ];

      let completed = 0;
      let failed = 0;

      for (const product of products) {
        const body: any = {
          name: product.name,
          slug: product.slug,
          description: product.description,
          shortDescription: product.shortDescription,
          status: product.status,
          images: product.images,
          variants: (product.variants as any[]).map((v) => ({
            sku: v.sku,
            name: v.name,
            price: v.price,
            compareAtPrice: v.compareAtPrice,
            currency: v.currency,
            quantityOnHand: v.quantityOnHand,
            options: v.options,
          })),
        };

        if (product.brandId) body.brandId = product.brandId;
        if (product.categoryIds.length) body.categoryIds = product.categoryIds;

        try {
          await this.http.post(`${this.api}/admin/products`, body).toPromise();
          completed++;
        } catch {
          failed++;
        }
      }

      this.setStatus('products', failed > 0 ? 'error' : 'done');
      this.toast.success('Products seeded', `${completed} created, ${failed} skipped.`);
    } catch {
      this.setStatus('products', 'error');
      this.toast.error(
        'Products seed failed',
        'Could not load brands/categories. Seed them first.',
      );
    }
  }

  private seedUsers() {
    this.setStatus('users', 'loading');

    const users = [
      {
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@example.com',
        phone: '+61400001001',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['ADMIN'],
      },
      {
        firstName: 'James',
        lastName: 'Smith',
        email: 'james.smith@example.com',
        phone: '+61400001002',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['ADMIN'],
      },
      {
        firstName: 'Emily',
        lastName: 'Williams',
        email: 'emily.williams@example.com',
        phone: '+61400001003',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'Michael',
        lastName: 'Brown',
        email: 'michael.brown@example.com',
        phone: '+61400001004',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'Jessica',
        lastName: 'Davis',
        email: 'jessica.davis@example.com',
        phone: '+61400001005',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'David',
        lastName: 'Miller',
        email: 'david.miller@example.com',
        phone: '+61400001006',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'Lisa',
        lastName: 'Wilson',
        email: 'lisa.wilson@example.com',
        phone: '+61400001007',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'Robert',
        lastName: 'Taylor',
        email: 'robert.taylor@example.com',
        phone: '+61400001008',
        password: 'StrongPass123!',
        status: 'INACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'Amanda',
        lastName: 'Anderson',
        email: 'amanda.anderson@example.com',
        phone: '+61400001009',
        password: 'StrongPass123!',
        status: 'ACTIVE',
        roles: ['CUSTOMER'],
      },
      {
        firstName: 'Chris',
        lastName: 'Thomas',
        email: 'chris.thomas@example.com',
        phone: '+61400001010',
        password: 'StrongPass123!',
        status: 'SUSPENDED',
        roles: ['CUSTOMER'],
      },
    ];

    const requests = users.map((u) =>
      this.http.post(`${this.api}/admin/users`, {
        ...u,
        emailVerified: true,
      }),
    );

    let completed = 0;
    let failed = 0;

    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed + failed === users.length) {
            this.setStatus('users', failed > 0 ? 'error' : 'done');
            this.toast.success('Users seeded', `${completed} created, ${failed} skipped.`);
          }
        },
        error: () => {
          failed++;
          if (completed + failed === users.length) {
            this.setStatus('users', failed > 0 ? 'error' : 'done');
            this.toast.success('Users seeded', `${completed} created, ${failed} skipped.`);
          }
        },
      });
    });
  }

  private seedShipping() {
    this.setStatus('shipping', 'loading');

    const methods = [
      {
        name: 'Standard Shipping',
        code: 'STANDARD',
        description: 'Reliable standard delivery within 3-7 business days.',
        price: '10.00',
        currency: 'AUD',
        estimatedMinDays: 3,
        estimatedMaxDays: 7,
      },
      {
        name: 'Express Shipping',
        code: 'EXPRESS',
        description: 'Faster delivery within 1-3 business days.',
        price: '25.00',
        currency: 'AUD',
        estimatedMinDays: 1,
        estimatedMaxDays: 3,
      },
      {
        name: 'Free Shipping',
        code: 'FREE',
        description: 'Free standard shipping on orders over $100.',
        price: '0.00',
        currency: 'AUD',
        estimatedMinDays: 5,
        estimatedMaxDays: 10,
      },
      {
        name: 'Overnight Shipping',
        code: 'OVERNIGHT',
        description: 'Next business day delivery for urgent orders.',
        price: '45.00',
        currency: 'AUD',
        estimatedMinDays: 1,
        estimatedMaxDays: 1,
      },
    ];

    const requests = methods.map((m) =>
      this.http.post(`${this.api}/admin/shipping/methods`, { ...m, isActive: true }),
    );

    let completed = 0;
    let failed = 0;

    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed + failed === methods.length) {
            this.setStatus('shipping', failed > 0 ? 'error' : 'done');
            this.toast.success(
              'Shipping methods seeded',
              `${completed} created, ${failed} skipped.`,
            );
          }
        },
        error: () => {
          failed++;
          if (completed + failed === methods.length) {
            this.setStatus('shipping', failed > 0 ? 'error' : 'done');
            this.toast.success(
              'Shipping methods seeded',
              `${completed} created, ${failed} skipped.`,
            );
          }
        },
      });
    });
  }

  private seedCoupons() {
    this.setStatus('coupons', 'loading');

    const coupons = [
      {
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: '10.00',
        minimumOrderAmount: '50.00',
        maximumDiscountAmount: '100.00',
        usageLimit: 1000,
        usageLimitPerUser: 1,
      },
      {
        code: 'SAVE20',
        type: 'PERCENTAGE',
        value: '20.00',
        minimumOrderAmount: '100.00',
        maximumDiscountAmount: '200.00',
        usageLimit: 500,
        usageLimitPerUser: 1,
      },
      {
        code: 'FLAT50',
        type: 'FIXED_AMOUNT',
        value: '50.00',
        minimumOrderAmount: '200.00',
        usageLimit: 200,
        usageLimitPerUser: 2,
      },
      {
        code: 'SUMMER25',
        type: 'PERCENTAGE',
        value: '25.00',
        minimumOrderAmount: '75.00',
        maximumDiscountAmount: '150.00',
        usageLimit: 300,
        usageLimitPerUser: 1,
      },
      {
        code: 'VIP100',
        type: 'FIXED_AMOUNT',
        value: '100.00',
        minimumOrderAmount: '500.00',
        usageLimit: 100,
        usageLimitPerUser: 1,
      },
    ];

    const requests = coupons.map((c) =>
      this.http.post(`${this.api}/admin/coupons`, { ...c, isActive: true }),
    );

    let completed = 0;
    let failed = 0;

    requests.forEach((req) => {
      req.subscribe({
        next: () => {
          completed++;
          if (completed + failed === coupons.length) {
            this.setStatus('coupons', failed > 0 ? 'error' : 'done');
            this.toast.success('Coupons seeded', `${completed} created, ${failed} skipped.`);
          }
        },
        error: () => {
          failed++;
          if (completed + failed === coupons.length) {
            this.setStatus('coupons', failed > 0 ? 'error' : 'done');
            this.toast.success('Coupons seeded', `${completed} created, ${failed} skipped.`);
          }
        },
      });
    });
  }

  seedAll() {
    this.seedCategories();
    setTimeout(() => this.seedBrands(), 500);
    setTimeout(() => this.seedUsers(), 1000);
    setTimeout(() => this.seedShipping(), 1500);
    setTimeout(() => this.seedCoupons(), 2000);
    setTimeout(() => this.seedProducts(), 3000);
  }

  seed(type: keyof SeedStatus) {
    switch (type) {
      case 'categories':
        this.seedCategories();
        break;
      case 'brands':
        this.seedBrands();
        break;
      case 'products':
        this.seedProducts();
        break;
      case 'users':
        this.seedUsers();
        break;
      case 'shipping':
        this.seedShipping();
        break;
      case 'coupons':
        this.seedCoupons();
        break;
    }
  }
}
