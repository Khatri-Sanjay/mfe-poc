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
export class MockRetailerSource implements ProductSource {
	readonly name = 'Flipkart';

	search(query: string, context: ProductSourceSearchContext): Promise<ExternalProductOffer[]> {
		void query;
		return Promise.resolve([
			{
				store: 'Website B',
				title: [context.name, context.variant, context.storage, context.color].filter(Boolean).join(' '),
				brand: context.brand,
				model: context.model,
				variant: context.variant,
				storage: context.storage,
				color: context.color,
				sku: context.sku,
				price: round(context.price * 0.981),
				shippingCost: 0,
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.8,
				url: `https://example.com/retailer/products/${encodeURIComponent(context.sku ?? context.productId)}`
			}
		]);
	}

	searchByName(query: string, context: ProductSearchContext): Promise<ExternalProductOffer[]> {
		return Promise.resolve([
			{
				store: 'Flipkart',
				title: `${query} with bank offer`,
				price: estimatePrice(query, 0.97),
				shippingCost: 49,
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.4,
				url: `https://www.flipkart.com/search?q=${encodeURIComponent(query)}`
			},
			{
				store: 'Flipkart',
				title: `${query} exchange discount option`,
				price: estimatePrice(query, 0.93),
				shippingCost: 0,
				currency: context.currency,
				availability: 'In Stock',
				rating: 4.2,
				url: `https://www.flipkart.com/search?q=${encodeURIComponent(`${query} exchange`)}`
			}
		]);
	}
}
