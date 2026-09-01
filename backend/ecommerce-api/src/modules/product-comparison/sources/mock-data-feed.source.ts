import { Injectable } from '@nestjs/common';
import type { ExternalProductOffer, ProductSource, ProductSourceSearchContext } from '../interfaces/product-source.interface';

const round = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class MockDataFeedSource implements ProductSource {
	readonly name = 'Mock Data Feed';

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
}
