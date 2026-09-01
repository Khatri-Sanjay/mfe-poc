import { Injectable } from '@nestjs/common';
import type { ExternalProductOffer, ProductSource, ProductSourceSearchContext } from '../interfaces/product-source.interface';

const round = (value: number): number => Math.round(value * 100) / 100;

@Injectable()
export class MockRetailerSource implements ProductSource {
	readonly name = 'Mock Retailer';

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
}
