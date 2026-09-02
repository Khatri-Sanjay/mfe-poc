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
export class MockDataFeedSource implements ProductSource {
	readonly name = 'Croma';

	search(query: string, context: ProductSourceSearchContext): Promise<ExternalProductOffer[]> {
		void query;
		return Promise.resolve([
			{
				store: 'Website C',
				title: [context.brand, context.name, context.storage, context.color].filter(Boolean).join(' '),
				brand: context.brand,
				model: context.model,
				variant: context.variant,
				storage: context.storage,
				color: context.color,
				barcode: context.barcode,
				price: round(context.price * 1.028),
				shippingCost: round(Math.max(0, context.price * 0.014)),
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.3,
				url: `https://example.com/feed/offers/${encodeURIComponent(context.productId)}`
			}
		]);
	}

	searchByName(query: string, context: ProductSearchContext): Promise<ExternalProductOffer[]> {
		return Promise.resolve([
			{
				store: 'Croma',
				title: `${query} - store pickup available`,
				price: estimatePrice(query, 1.01),
				shippingCost: 0,
				currency: context.currency,
				availability: 'Store Pickup',
				rating: 4.1,
				url: `https://www.croma.com/searchB?q=${encodeURIComponent(query)}`
			}
		]);
	}
}
