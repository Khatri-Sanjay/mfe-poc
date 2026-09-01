import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../../products/services/products.service';
import type { ProductResponseDto, ProductVariantResponseDto } from '../../products/dto/product-response.dto';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { ProductComparisonResponseDto } from '../dto/product-comparison-response.dto';
import {
	ExternalProductOffer,
	PRODUCT_SOURCES,
	ProductSource,
	ProductSourceSearchContext
} from '../interfaces/product-source.interface';
import { ProductMatchingService } from './product-matching.service';

const round = (value: number): number => Math.round(value * 100) / 100;

type NormalizedComparisonOffer = ExternalProductOffer & {
	shippingCost: number;
	totalPrice: number;
};

@Injectable()
export class ProductComparisonService {
	constructor(
		private readonly productsService: ProductsService,
		private readonly productMatchingService: ProductMatchingService,
		@Inject(PRODUCT_SOURCES)
		private readonly sources: ProductSource[]
	) {}

	async compare(productId: string): Promise<ProductComparisonResponseDto> {
		const product = await this.productsService.getPublicById(productId);
		const context = this.createSearchContext(product);
		const query = this.buildSearchQuery(context);
		const sourceResults = await Promise.all(this.sources.map((source) => source.search(query, context)));
		const externalOffers = sourceResults.flat().filter((offer) => this.productMatchingService.isMatch(context, offer));
		const offers = this.createOffers(context, externalOffers);
		const totals = offers.map((offer) => offer.totalPrice);
		const lowestPrice = Math.min(...totals);
		const highestPrice = Math.max(...totals);
		const averagePrice = round(totals.reduce((sum, price) => sum + price, 0) / totals.length);
		const differenceFromLowest = round(context.price - lowestPrice);
		const cheapestOffer = offers.find((offer) => offer.totalPrice === lowestPrice);
		const bestRatedOffer = [...offers]
			.filter((offer) => offer.rating !== undefined)
			.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.totalPrice - b.totalPrice)[0];
		const bestValueOffer = this.findBestValueOffer(offers);

		return {
			product: {
				id: product.id,
				name: product.name,
				brand: context.brand,
				model: context.model,
				variant: context.variant,
				storage: context.storage,
				color: context.color,
				sku: context.sku,
				barcode: context.barcode,
				ourPrice: context.price,
				currency: context.currency
			},
			market: {
				lowestPrice,
				highestPrice,
				averagePrice,
				differenceFromLowest,
				potentialSaving: Math.max(0, differenceFromLowest)
			},
			offers: offers.map((offer) => ({
				...offer,
				isCheapest: offer.totalPrice === lowestPrice
			})),
			recommendations: {
				cheapest: cheapestOffer?.store,
				bestRated: bestRatedOffer?.store,
				bestValue: bestValueOffer?.store
			}
		};
	}

	private createSearchContext(product: ProductResponseDto): ProductSourceSearchContext {
		const variant = this.selectVariant(product);
		const options = variant.options ?? {};
		const brand = product.brand?.name;
		const storage = this.optionValue(options, ['storage', 'capacity', 'size']);
		const color = this.optionValue(options, ['color', 'colour']);

		return {
			productId: product.id,
			name: product.name,
			brand,
			model: this.inferModel(product.name, brand),
			variant: variant.name,
			storage,
			color,
			sku: variant.sku,
			barcode: variant.barcode ?? undefined,
			price: Number(variant.price),
			currency: variant.currency
		};
	}

	private selectVariant(product: ProductResponseDto): ProductVariantResponseDto {
		const variant = product.variants.find((item) => item.isActive) ?? product.variants[0];
		if (!variant) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product variant was not found'
			});
		}
		return variant;
	}

	private optionValue(options: Record<string, string>, keys: string[]): string | undefined {
		const found = Object.entries(options).find(([key]) => keys.includes(key.toLowerCase()));
		return found?.[1];
	}

	private inferModel(name: string, brand?: string): string {
		return brand ? name.replace(new RegExp(`^${brand}\\s+`, 'i'), '') : name;
	}

	private buildSearchQuery(context: ProductSourceSearchContext): string {
		return [context.brand, context.name, context.variant, context.storage, context.color, context.sku].filter(Boolean).join(' ');
	}

	private createOffers(context: ProductSourceSearchContext, externalOffers: ExternalProductOffer[]): NormalizedComparisonOffer[] {
		const ourOffer: NormalizedComparisonOffer = {
			store: 'Our Store',
			title: [context.name, context.storage, context.color].filter(Boolean).join(' '),
			brand: context.brand,
			model: context.model,
			variant: context.variant,
			storage: context.storage,
			color: context.color,
			price: context.price,
			shippingCost: 0,
			totalPrice: context.price,
			currency: context.currency,
			availability: 'In Stock',
			url: `/products/${context.productId}`
		};

		return [ourOffer, ...externalOffers.map((offer) => this.normalizeOffer(offer))].sort((a, b) => a.totalPrice - b.totalPrice);
	}

	private normalizeOffer(offer: ExternalProductOffer): NormalizedComparisonOffer {
		const shippingCost = offer.shippingCost ?? 0;
		return {
			...offer,
			shippingCost,
			totalPrice: round(offer.price + shippingCost)
		};
	}

	private findBestValueOffer<TOffer extends { totalPrice: number; rating?: number }>(offers: TOffer[]): TOffer | undefined {
		return [...offers].sort((a, b) => {
			const aScore = a.totalPrice - (a.rating ?? 0) * 5;
			const bScore = b.totalPrice - (b.rating ?? 0) * 5;
			return aScore - bScore;
		})[0];
	}
}
