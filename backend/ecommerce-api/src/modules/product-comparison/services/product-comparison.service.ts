import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import type { ProductResponseDto, ProductVariantResponseDto } from '../../products/dto/product-response.dto';
import { ProductsService } from '../../products/services/products.service';
import {
	ProductComparisonOfferDto,
	ProductComparisonResponseDto,
	RecommendationDto,
	RiskWarningDto
} from '../dto/product-comparison-response.dto';
import {
	ExternalProductOffer,
	PRODUCT_SOURCES,
	ProductSearchContext,
	ProductSource,
	ProductSourceSearchContext
} from '../interfaces/product-source.interface';
import { ProductImageResolverService } from './product-image-resolver.service';
import { ProductMatchingService } from './product-matching.service';

const round = (value: number): number => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));
const targetCurrency = 'NPR';
const defaultCountryCode = process.env.PRICE_LENS_DEFAULT_COUNTRY_CODE ?? 'NP';
const usdToNpr = Number(process.env.PRICE_LENS_USD_TO_NPR ?? 133);
const currencyToUsd: Record<string, number> = {
	USD: 1,
	NPR: 1 / usdToNpr,
	INR: 1 / Number(process.env.PRICE_LENS_USD_TO_INR ?? 83),
	GBP: 1 / Number(process.env.PRICE_LENS_GBP_TO_USD_DENOMINATOR ?? 0.79),
	CNY: 1 / Number(process.env.PRICE_LENS_USD_TO_CNY ?? 7.1),
	JPY: 1 / Number(process.env.PRICE_LENS_USD_TO_JPY ?? 150)
};

const countryNames: Record<string, string> = {
	GLOBAL: 'Global',
	NP: 'Nepal',
	IN: 'India',
	US: 'United States',
	GB: 'United Kingdom',
	CN: 'China',
	JP: 'Japan'
};

type NormalizedComparisonOffer = ExternalProductOffer & {
	id: string;
	country: string;
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
		private readonly productImageResolver: ProductImageResolverService,
		@Inject(PRODUCT_SOURCES)
		private readonly sources: ProductSource[]
	) {}

	async compare(productId: string): Promise<ProductComparisonResponseDto> {
		const product = await this.productsService.getPublicById(productId);
		const context = this.createSearchContext(product);
		const query = this.buildSearchQuery(context);
		const sourceResults = await Promise.all(this.sources.map((source) => source.search(query, context)));
		const externalOffers = sourceResults.flat().filter((offer) => this.productMatchingService.isMatch(context, offer));
		const catalogImage = this.primaryProductImage(product);
		const imageResolvedExternalOffers = await this.productImageResolver.resolveOfferImages(query, externalOffers);
		const productImage = this.productImageResolver.resolveProductImage(imageResolvedExternalOffers, catalogImage);
		const offers = this.createOffers(context, imageResolvedExternalOffers, catalogImage);

		return this.createComparisonResponse({
			product: {
				id: product.id,
				name: product.name,
				brand: context.brand,
				category: product.categories?.[0]?.name,
				model: context.model,
				variant: context.variant,
				storage: context.storage,
				color: context.color,
				sku: context.sku,
				barcode: context.barcode,
				ourPrice: context.price,
				imageUrl: productImage,
				currency: targetCurrency
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
		const externalOffers = sourceResults.flat().filter((offer) => this.isQueryMatch(normalizedQuery, offer));
		const imageResolvedOffers = await this.productImageResolver.resolveOfferImages(normalizedQuery, externalOffers);
		const offers = imageResolvedOffers
			.map((offer, index) => this.normalizeOffer(offer, index, normalizedQuery))
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
				brand: this.inferBrand(normalizedQuery),
				category: this.inferCategory(normalizedQuery),
				imageUrl: this.productImageResolver.resolveProductImage(imageResolvedOffers),
				currency: targetCurrency
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

	private inferBrand(name: string): string | undefined {
		const lower = name.toLowerCase();
		for (const brand of ['Samsung', 'Apple', 'Nike', 'Sony', 'Dell', 'HP', 'Lenovo', 'Google']) {
			if (lower.includes(brand.toLowerCase())) return brand;
		}
		return undefined;
	}

	private inferCategory(name: string): string | undefined {
		const lower = name.toLowerCase();
		if (/(phone|iphone|galaxy|pixel)/.test(lower)) return 'Smartphone';
		if (/(macbook|laptop|notebook)/.test(lower)) return 'Laptop';
		if (/(shoe|sneaker|running)/.test(lower)) return 'Footwear';
		if (/(headphone|earbud|speaker)/.test(lower)) return 'Audio';
		return undefined;
	}

	private buildSearchQuery(context: ProductSourceSearchContext): string {
		return [context.brand, context.name, context.variant, context.storage, context.color, context.sku].filter(Boolean).join(' ');
	}

	private createOffers(
		context: ProductSourceSearchContext,
		externalOffers: ExternalProductOffer[],
		catalogImage?: string
	): NormalizedComparisonOffer[] {
		const ourOffer = this.normalizeOffer(
			{
				store: 'Our Store',
				title: [context.name, context.storage, context.color].filter(Boolean).join(' '),
				brand: context.brand,
				model: context.model,
				variant: context.variant,
				storage: context.storage,
				color: context.color,
				price: context.price,
				shippingCost: 0,
				currency: context.currency,
				availability: 'In Stock',
				url: `/products/${context.productId}`,
				imageUrl: catalogImage,
				region: defaultCountryCode === 'NP' ? 'Nepal' : countryNames[defaultCountryCode],
				countryCode: defaultCountryCode
			},
			0,
			context.name
		);

		return [ourOffer, ...externalOffers.map((offer, index) => this.normalizeOffer(offer, index + 1, context.name))].sort(
			(a, b) => a.totalPriceUsd - b.totalPriceUsd
		);
	}

	private createComparisonResponse(input: {
		product: {
			id: string;
			name: string;
			brand?: string;
			category?: string;
			model?: string;
			variant?: string;
			storage?: string;
			color?: string;
			sku?: string;
			barcode?: string;
			ourPrice?: number;
			imageUrl?: string;
			currency: string;
		};
		offers: NormalizedComparisonOffer[];
	}): ProductComparisonResponseDto {
		const totals = input.offers.map((offer) => offer.totalPriceNpr);
		const lowestPrice = Math.min(...totals);
		const highestPrice = Math.max(...totals);
		const averagePrice = round(totals.reduce((sum, price) => sum + price, 0) / totals.length);
		const availableOffers = input.offers.filter((offer) => this.isAvailable(offer.availability));
		const riskWarnings = this.createRiskWarnings(input.offers, averagePrice, lowestPrice);
		const offers = input.offers.map((offer) => this.createOfferDto(offer, input.product.name, lowestPrice, averagePrice));
		const recommendations = this.createRecommendations(offers);
		const bestOverall = recommendations.bestOverall;
		const percentBelowAverage = averagePrice > 0 ? Math.max(0, Math.round(((averagePrice - lowestPrice) / averagePrice) * 100)) : 0;
		const percentAboveLowest =
			bestOverall && lowestPrice > 0 ? Math.max(0, Math.round(((bestOverall.totalPrice - lowestPrice) / lowestPrice) * 100)) : 0;
		const recommendation = this.createBuyRecommendation(percentBelowAverage, bestOverall?.score ?? 0);
		const reportWarnings = [
			...new Set([
				...riskWarnings.map((warning) => warning.message),
				...(bestOverall?.warnings ?? []),
				'Verify seller, product variant, warranty and shipping conditions.'
			])
		];

		return {
			product: input.product,
			summary: {
				currency: targetCurrency,
				lowestPrice,
				averagePrice,
				highestPrice,
				potentialSavingVsAverage: round(Math.max(0, averagePrice - lowestPrice)),
				maxPotentialSaving: round(Math.max(0, highestPrice - lowestPrice)),
				offersCount: offers.length,
				availableOffersCount: availableOffers.length
			},
			recommendations,
			priceAnalysis: {
				marketPosition:
					percentBelowAverage >= 20 ? 'Below Average' : percentAboveLowest > 10 ? 'Above Lowest' : 'Near Market Average',
				percentBelowAverage,
				percentAboveLowest,
				recommendation,
				priceRange: {
					min: lowestPrice,
					max: highestPrice
				}
			},
			regionalAnalysis: this.createRegionalAnalysis(input.offers),
			offers,
			riskAnalysis: {
				hasWarnings: riskWarnings.length > 0,
				warnings: riskWarnings
			},
			report: {
				headline:
					recommendation === 'BUY'
						? 'Strong buying opportunity'
						: recommendation === 'COMPARE'
							? 'Compare top offers carefully'
							: 'Wait for a better deal',
				recommendation,
				confidence: clamp(bestOverall?.score ?? 60, 45, 95),
				summary:
					recommendation === 'BUY'
						? 'The current lowest total price is meaningfully below the market average based on available offers.'
						: 'Available offers are close enough that seller, availability and shipping conditions should drive the decision.',
				highlights: [
					'Lowest identified total price',
					...(bestOverall?.rating ? ['Seller rating is available'] : []),
					`${offers.length} comparable offers available`
				],
				warnings: reportWarnings
			},
			metadata: {
				generatedAt: new Date().toISOString(),
				preferredCountryCode: defaultCountryCode,
				targetCurrency,
				sourceCount: this.sources.length,
				historyAvailable: false
			},
			market: {
				lowestPrice: this.nprToUsd(lowestPrice),
				lowestPriceUsd: this.nprToUsd(lowestPrice),
				lowestPriceNpr: lowestPrice,
				highestPrice: this.nprToUsd(highestPrice),
				highestPriceUsd: this.nprToUsd(highestPrice),
				highestPriceNpr: highestPrice,
				averagePrice: this.nprToUsd(averagePrice),
				averagePriceUsd: this.nprToUsd(averagePrice),
				averagePriceNpr: averagePrice,
				differenceFromLowest: round(Math.max(0, averagePrice - lowestPrice)),
				potentialSaving: round(Math.max(0, averagePrice - lowestPrice))
			}
		};
	}

	private createOfferDto(
		offer: NormalizedComparisonOffer,
		query: string,
		lowestPriceNpr: number,
		averagePriceNpr: number
	): ProductComparisonOfferDto {
		const dealScore = this.createDealScore(offer, lowestPriceNpr, averagePriceNpr);
		const reasons = this.createOfferReasons(offer, lowestPriceNpr, averagePriceNpr);
		const warnings = this.createOfferWarnings(offer);

		return {
			...offer,
			isCheapest: offer.totalPriceNpr === lowestPriceNpr,
			pricing: {
				original: { amount: offer.price, currency: offer.currency },
				shipping: { amount: offer.shippingCost, currency: offer.currency },
				total: { amount: offer.totalPrice, currency: offer.currency },
				converted: {
					currency: targetCurrency,
					productPrice: offer.priceNpr,
					shipping: offer.shippingCostNpr,
					total: offer.totalPriceNpr
				}
			},
			dealScore,
			match: this.createMatch(query, offer),
			reasons,
			warnings
		};
	}

	private normalizeOffer(offer: ExternalProductOffer, index: number, query: string): NormalizedComparisonOffer {
		const shippingCost = offer.shippingCost ?? 0;
		const totalPrice = round(offer.price + shippingCost);
		const priceUsd = this.convertToUsd(offer.price, offer.currency);
		const shippingCostUsd = this.convertToUsd(shippingCost, offer.currency);
		const totalPriceUsd = round(priceUsd + shippingCostUsd);
		const countryCode = offer.countryCode ?? 'GLOBAL';

		return {
			...offer,
			id: `${this.slugify(offer.store)}-${this.slugify(query)}-${index}`,
			imageUrl: offer.imageUrl,
			countryCode,
			country: countryNames[countryCode] ?? offer.region ?? countryCode,
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

	private createDealScore(offer: NormalizedComparisonOffer, lowestPriceNpr: number, averagePriceNpr: number) {
		const price = clamp(Math.round(100 - ((offer.totalPriceNpr - lowestPriceNpr) / Math.max(lowestPriceNpr, 1)) * 140), 0, 100);
		const shippingRatio = offer.shippingCostNpr / Math.max(offer.totalPriceNpr, 1);
		const shipping = clamp(Math.round(100 - shippingRatio * 260), 0, 100);
		const rating = offer.rating === undefined ? undefined : clamp(Math.round((offer.rating / 5) * 100), 0, 100);
		const availability = this.isAvailable(offer.availability) ? 95 : offer.availability?.toLowerCase().includes('limited') ? 75 : 55;
		const regionalAvailability = offer.countryCode === defaultCountryCode ? 95 : offer.countryCode === 'GLOBAL' ? 82 : 72;
		const averageDiscountBoost = offer.totalPriceNpr < averagePriceNpr ? 5 : -5;
		const ratingPart = rating ?? 70;
		const score = clamp(
			Math.round(
				price * 0.42 +
					shipping * 0.18 +
					ratingPart * 0.18 +
					availability * 0.14 +
					regionalAvailability * 0.08 +
					averageDiscountBoost
			),
			0,
			100
		);

		return {
			score,
			label: this.dealLabel(score),
			breakdown: {
				price,
				shipping,
				...(rating === undefined ? {} : { rating }),
				availability,
				regionalAvailability
			}
		};
	}

	private createOfferReasons(offer: NormalizedComparisonOffer, lowestPriceNpr: number, averagePriceNpr: number): string[] {
		const reasons: string[] = [];
		if (offer.totalPriceNpr === lowestPriceNpr) reasons.push('Lowest total price');
		if (offer.totalPriceNpr < averagePriceNpr) {
			reasons.push(`${Math.round(((averagePriceNpr - offer.totalPriceNpr) / averagePriceNpr) * 100)}% below market average`);
		}
		if (this.isAvailable(offer.availability)) reasons.push('Currently available');
		if (offer.rating !== undefined) reasons.push(`${offer.rating.toFixed(1)} seller rating`);
		if (offer.shippingCostNpr === 0) reasons.push('No listed shipping cost');
		return reasons;
	}

	private createOfferWarnings(offer: NormalizedComparisonOffer): string[] {
		const warnings: string[] = [];
		if (offer.countryCode && ![defaultCountryCode, 'GLOBAL'].includes(offer.countryCode)) warnings.push('International purchase');
		if (offer.countryCode === 'GLOBAL') warnings.push('Verify regional shipping and warranty conditions');
		if (!this.isAvailable(offer.availability)) warnings.push('Availability should be verified with the seller');
		return warnings;
	}

	private createMatch(query: string, offer: NormalizedComparisonOffer) {
		const queryTokens = this.significantTokens(query);
		const offerTokens = new Set(
			this.significantTokens([offer.title, offer.brand, offer.model, offer.variant].filter(Boolean).join(' '))
		);
		const matched = queryTokens.filter((token) => offerTokens.has(token)).length;
		const confidence = queryTokens.length ? clamp(Math.round((matched / queryTokens.length) * 100), 45, 98) : 70;
		return {
			confidence,
			status: confidence >= 85 ? ('HIGH' as const) : confidence >= 65 ? ('MEDIUM' as const) : ('LOW' as const),
			warnings: confidence < 85 ? ['Confirm exact model, storage and variant before buying.'] : []
		};
	}

	private createRecommendations(offers: ProductComparisonOfferDto[]) {
		const byPrice = [...offers].sort((a, b) => a.totalPriceNpr - b.totalPriceNpr);
		const byRating = [...offers]
			.filter((offer) => offer.rating !== undefined)
			.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || b.dealScore.score - a.dealScore.score);
		const local = [...offers]
			.filter((offer) => offer.countryCode === defaultCountryCode)
			.sort((a, b) => b.dealScore.score - a.dealScore.score || a.totalPriceNpr - b.totalPriceNpr);
		const byShipping = [...offers].sort((a, b) => a.shippingCostNpr - b.shippingCostNpr || b.dealScore.score - a.dealScore.score);
		const byOverall = [...offers].sort((a, b) => b.dealScore.score - a.dealScore.score || a.totalPriceNpr - b.totalPriceNpr);
		const bestOverall = byOverall[0];

		return {
			bestOverall: bestOverall ? this.toRecommendation(bestOverall) : undefined,
			cheapest: byPrice[0] ? this.toRecommendation(byPrice[0]) : undefined,
			bestRated: byRating[0] ? this.toRecommendation(byRating[0]) : undefined,
			bestLocal: local[0] ? this.toRecommendation(local[0]) : undefined,
			bestShipping: byShipping[0] ? this.toRecommendation(byShipping[0]) : undefined,
			bestValue: bestOverall?.store
		};
	}

	private toRecommendation(offer: ProductComparisonOfferDto): RecommendationDto {
		return {
			store: offer.store,
			offerId: offer.id,
			title: offer.title,
			totalPrice: offer.totalPriceNpr,
			currency: targetCurrency,
			score: offer.dealScore.score,
			rating: offer.rating,
			region: offer.region,
			countryCode: offer.countryCode,
			url: offer.url,
			reason: offer.reasons,
			warnings: offer.warnings
		};
	}

	private createRegionalAnalysis(offers: NormalizedComparisonOffer[]) {
		const grouped = new Map<string, NormalizedComparisonOffer[]>();
		for (const offer of offers) {
			const key = offer.countryCode ?? 'GLOBAL';
			grouped.set(key, [...(grouped.get(key) ?? []), offer]);
		}

		return [...grouped.entries()]
			.map(([countryCode, group]) => {
				const totals = group.map((offer) => offer.totalPriceNpr);
				return {
					countryCode,
					country: countryNames[countryCode] ?? group[0]?.region ?? countryCode,
					lowestPrice: Math.min(...totals),
					averagePrice: round(totals.reduce((sum, total) => sum + total, 0) / totals.length),
					offerCount: group.length
				};
			})
			.sort((a, b) => a.lowestPrice - b.lowestPrice);
	}

	private createRiskWarnings(offers: NormalizedComparisonOffer[], averagePriceNpr: number, lowestPriceNpr: number): RiskWarningDto[] {
		const warnings: RiskWarningDto[] = [];
		if (lowestPriceNpr < averagePriceNpr * 0.65 && offers.length >= 4) {
			warnings.push({
				type: 'UNUSUALLY_LOW_PRICE',
				severity: 'medium',
				message:
					'This offer is significantly below the market average. Verify seller, product variant, warranty and shipping conditions.'
			});
		}
		if (offers.some((offer) => offer.countryCode === 'GLOBAL')) {
			warnings.push({
				type: 'INTERNATIONAL_MARKETPLACE',
				severity: 'low',
				message: 'Some offers may involve international sellers. Confirm shipping, warranty and import conditions before purchase.'
			});
		}
		return warnings;
	}

	private createBuyRecommendation(percentBelowAverage: number, bestScore: number): 'BUY' | 'COMPARE' | 'WAIT' {
		if (percentBelowAverage >= 18 && bestScore >= 75) return 'BUY';
		if (bestScore < 60) return 'WAIT';
		return 'COMPARE';
	}

	private dealLabel(score: number): string {
		if (score >= 90) return 'Excellent Deal';
		if (score >= 75) return 'Good Deal';
		if (score >= 60) return 'Fair Deal';
		return 'Weak Deal';
	}

	private isAvailable(value?: string): boolean {
		const normalized = (value ?? '').toLowerCase();
		return ['available', 'in stock', 'store pickup'].some((marker) => normalized.includes(marker));
	}

	private convertToUsd(value: number, currency: string): number {
		const rate = currencyToUsd[currency.toUpperCase()] ?? 1;
		return round(value * rate);
	}

	private usdToNpr(value: number): number {
		return round(value * usdToNpr);
	}

	private nprToUsd(value: number): number {
		return round(value / usdToNpr);
	}

	private isQueryMatch(query: string, offer: ExternalProductOffer): boolean {
		const requiredTokens = this.significantTokens(query);
		const offerText = [offer.title, offer.brand, offer.model, offer.variant].filter(Boolean).join(' ').toLowerCase();

		return requiredTokens.every((token) => offerText.includes(token));
	}

	private significantTokens(value: string): string[] {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ' ')
			.split(' ')
			.filter((token) => token.length > 1)
			.filter((token) => !['with', 'and', 'the', 'for', 'from'].includes(token));
	}

	private slugify(value: string): string {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-|-$/g, '');
	}

	private primaryProductImage(product: ProductResponseDto): string | undefined {
		return product.images.find((image) => image.isPrimary)?.url ?? product.images[0]?.url ?? undefined;
	}
}
