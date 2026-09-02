import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ProductsService } from '../../products/services/products.service';
import type { ProductResponseDto, ProductVariantResponseDto } from '../../products/dto/product-response.dto';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { ProductComparisonResponseDto } from '../dto/product-comparison-response.dto';
import {
	ExternalProductOffer,
	PRODUCT_SOURCES,
	ProductSource,
	ProductSearchContext,
	ProductSourceSearchContext
} from '../interfaces/product-source.interface';
import { ProductMatchingService } from './product-matching.service';

const round = (value: number): number => Math.round(value * 100) / 100;
const usdToNpr = Number(process.env.PRICE_LENS_USD_TO_NPR ?? 133);
const currencyToUsd: Record<string, number> = {
	USD: 1,
	NPR: 1 / usdToNpr,
	INR: 1 / Number(process.env.PRICE_LENS_USD_TO_INR ?? 83),
	GBP: 1 / Number(process.env.PRICE_LENS_GBP_TO_USD_DENOMINATOR ?? 0.79),
	CNY: 1 / Number(process.env.PRICE_LENS_USD_TO_CNY ?? 7.1),
	JPY: 1 / Number(process.env.PRICE_LENS_USD_TO_JPY ?? 150)
};

type NormalizedComparisonOffer = ExternalProductOffer & {
	shippingCost: number;
	totalPrice: number;
	priceUsd: number;
	priceNpr: number;
	shippingCostUsd: number;
	shippingCostNpr: number;
	totalPriceUsd: number;
	totalPriceNpr: number;
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

		return this.createComparisonResponse({
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
			offers
		});
	}

	async search(query: string): Promise<ProductComparisonResponseDto> {
		const normalizedQuery = query.replace(/\s+/g, ' ').trim();
		const context: ProductSearchContext = {
			query: normalizedQuery,
			currency: 'INR'
		};
		const sourceResults = await Promise.all(
			this.sources
				.filter((source) => typeof source.searchByName === 'function')
				.map((source) => source.searchByName?.(normalizedQuery, context) ?? Promise.resolve([]))
		);
		const offers = sourceResults
			.flat()
			.filter((offer) => this.isQueryMatch(normalizedQuery, offer))
			.map((offer) => this.normalizeOffer(offer))
			.sort((a, b) => a.totalPriceUsd - b.totalPriceUsd);

		if (!offers.length) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'No comparable offers were found for this product search'
			});
		}

		return this.createComparisonResponse({
			product: {
				id: this.slugify(normalizedQuery),
				name: normalizedQuery,
				currency: context.currency
			},
			offers
		});
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
			priceUsd: this.convertToUsd(context.price, context.currency),
			priceNpr: this.convertToNpr(context.price, context.currency),
			shippingCostUsd: 0,
			shippingCostNpr: 0,
			totalPriceUsd: this.convertToUsd(context.price, context.currency),
			totalPriceNpr: this.convertToNpr(context.price, context.currency),
			currency: context.currency,
			availability: 'In Stock',
			url: `/products/${context.productId}`
		};

		return [ourOffer, ...externalOffers.map((offer) => this.normalizeOffer(offer))].sort((a, b) => a.totalPriceUsd - b.totalPriceUsd);
	}

	private createComparisonResponse(input: {
		product: {
			id: string;
			name: string;
			brand?: string;
			model?: string;
			variant?: string;
			storage?: string;
			color?: string;
			sku?: string;
			barcode?: string;
			ourPrice?: number;
			currency: string;
		};
		offers: NormalizedComparisonOffer[];
	}): ProductComparisonResponseDto {
		const totals = input.offers.map((offer) => offer.totalPriceUsd);
		const lowestPrice = Math.min(...totals);
		const highestPrice = Math.max(...totals);
		const averagePrice = round(totals.reduce((sum, price) => sum + price, 0) / totals.length);
		const referencePrice = input.product.ourPrice ? this.convertToUsd(input.product.ourPrice, input.product.currency) : averagePrice;
		const differenceFromLowest = round(referencePrice - lowestPrice);
		const cheapestOffer = input.offers.find((offer) => offer.totalPriceUsd === lowestPrice);
		const bestRatedOffer = [...input.offers]
			.filter((offer) => offer.rating !== undefined)
			.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || a.totalPriceUsd - b.totalPriceUsd)[0];
		const bestValueOffer = this.findBestValueOffer(input.offers);

		return {
			product: {
				...input.product,
				ourPrice: input.product.ourPrice
			},
			market: {
				lowestPrice,
				lowestPriceUsd: lowestPrice,
				lowestPriceNpr: this.usdToNpr(lowestPrice),
				highestPrice,
				highestPriceUsd: highestPrice,
				highestPriceNpr: this.usdToNpr(highestPrice),
				averagePrice,
				averagePriceUsd: averagePrice,
				averagePriceNpr: this.usdToNpr(averagePrice),
				differenceFromLowest,
				potentialSaving: Math.max(0, differenceFromLowest)
			},
			offers: input.offers.map((offer) => ({
				...offer,
				isCheapest: offer.totalPriceUsd === lowestPrice
			})),
			recommendations: {
				cheapest: cheapestOffer?.store,
				bestRated: bestRatedOffer?.store,
				bestValue: bestValueOffer?.store
			}
		};
	}

	private normalizeOffer(offer: ExternalProductOffer): NormalizedComparisonOffer {
		const shippingCost = offer.shippingCost ?? 0;
		const totalPrice = round(offer.price + shippingCost);
		const priceUsd = this.convertToUsd(offer.price, offer.currency);
		const shippingCostUsd = this.convertToUsd(shippingCost, offer.currency);
		const totalPriceUsd = round(priceUsd + shippingCostUsd);

		return {
			...offer,
			shippingCost,
			totalPrice,
			priceUsd,
			priceNpr: this.usdToNpr(priceUsd),
			shippingCostUsd,
			shippingCostNpr: this.usdToNpr(shippingCostUsd),
			totalPriceUsd,
			totalPriceNpr: this.usdToNpr(totalPriceUsd)
		};
	}

	private convertToUsd(value: number, currency: string): number {
		const rate = currencyToUsd[currency.toUpperCase()] ?? 1;
		return round(value * rate);
	}

	private convertToNpr(value: number, currency: string): number {
		return this.usdToNpr(this.convertToUsd(value, currency));
	}

	private usdToNpr(value: number): number {
		return round(value * usdToNpr);
	}

	private isQueryMatch(query: string, offer: ExternalProductOffer): boolean {
		const requiredTokens = query
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ' ')
			.split(' ')
			.filter((token) => token.length > 1)
			.filter((token) => !['with', 'and', 'the', 'for'].includes(token));
		const offerText = [offer.title, offer.brand, offer.model, offer.variant]
			.filter(Boolean)
			.join(' ')
			.toLowerCase();

		return requiredTokens.every((token) => offerText.includes(token));
	}

	private slugify(value: string): string {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	private findBestValueOffer<TOffer extends { totalPriceUsd: number; rating?: number }>(offers: TOffer[]): TOffer | undefined {
		return [...offers].sort((a, b) => {
			const aScore = a.totalPriceUsd - (a.rating ?? 0) * 5;
			const bScore = b.totalPriceUsd - (b.rating ?? 0) * 5;
			return aScore - bScore;
		})[0];
	}
}
