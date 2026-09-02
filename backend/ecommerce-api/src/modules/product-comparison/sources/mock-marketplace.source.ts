import { Injectable } from '@nestjs/common';
import type {
	ExternalProductOffer,
	ProductSearchContext,
	ProductSource,
	ProductSourceSearchContext
} from '../interfaces/product-source.interface';

const round = (value: number): number => Math.round(value * 100) / 100;
const estimatePrice = (query: string, multiplier: number): number => {
	const seed = [...query.toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
	return round((18000 + (seed % 70000)) * multiplier);
};

@Injectable()
export class MockMarketplaceSource implements ProductSource {
	readonly name = 'Amazon';

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

	searchByName(query: string, context: ProductSearchContext): Promise<ExternalProductOffer[]> {
		return Promise.resolve([
			{
				store: 'Amazon',
				title: `${query} - featured marketplace deal`,
				price: estimatePrice(query, 1.03),
				shippingCost: 0,
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.5,
				url: `https://www.amazon.in/s?k=${encodeURIComponent(query)}`
			},
			{
				store: 'Amazon',
				title: `${query} - premium seller bundle`,
				price: estimatePrice(query, 1.12),
				shippingCost: 99,
				currency: context.currency,
				availability: 'Limited Stock',
				rating: 4.7,
				url: `https://www.amazon.in/s?k=${encodeURIComponent(`${query} premium`)}`
			}
		]);
	}
}
