import { Injectable } from '@nestjs/common';
import type { ExternalProductOffer, ProductSource, ProductSourceSearchContext } from '../interfaces/product-source.interface';

const round = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class MockMarketplaceSource implements ProductSource {
	readonly name = 'Mock Marketplace';

	search(query: string, context: ProductSourceSearchContext): Promise<ExternalProductOffer[]> {
		void query;
		return Promise.resolve([
			{
				store: 'Website A',
				title: this.title(context),
				brand: context.brand,
				model: context.model,
				variant: context.variant,
				storage: context.storage,
				color: context.color,
				sku: context.sku,
				barcode: context.barcode,
				price: round(context.price * 0.96),
				shippingCost: 0,
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.6,
				url: `https://example.com/marketplace/search?q=${encodeURIComponent(context.name)}`
			},
			{
				store: 'Website A',
				title: `${context.brand ?? ''} ${context.name} Pro ${context.storage ?? ''}`.trim(),
				brand: context.brand,
				model: `${context.model ?? context.name} Pro`,
				storage: context.storage,
				color: context.color,
				price: round(context.price * 1.18),
				shippingCost: 0,
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.8,
				url: 'https://example.com/marketplace/non-matching-pro'
			}
		]);
	}

	private title(context: ProductSourceSearchContext): string {
		return [context.brand, context.name, context.storage, context.color].filter(Boolean).join(' ');
	}
}
