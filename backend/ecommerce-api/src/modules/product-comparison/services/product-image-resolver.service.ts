import { Injectable } from '@nestjs/common';
import type { ExternalProductOffer } from '../interfaces/product-source.interface';

type CachedImage = {
	expiresAt: number;
	value?: string;
};

const cacheTtlMs = Number(process.env.PRICE_LENS_IMAGE_CACHE_TTL_MS ?? 1000 * 60 * 60 * 6);
const scrapeTimeoutMs = Number(process.env.PRICE_LENS_IMAGE_SCRAPE_TIMEOUT_MS ?? 2500);
const scrapeConcurrency = Number(process.env.PRICE_LENS_IMAGE_SCRAPE_CONCURRENCY ?? 5);
const imageScrapingEnabled =
	process.env.PRICE_LENS_ENABLE_IMAGE_SCRAPING === undefined
		? process.env.NODE_ENV !== 'test'
		: process.env.PRICE_LENS_ENABLE_IMAGE_SCRAPING !== 'false';

@Injectable()
export class ProductImageResolverService {
	private readonly cache = new Map<string, CachedImage>();

	async resolveOfferImages(query: string, offers: ExternalProductOffer[]): Promise<ExternalProductOffer[]> {
		if (!imageScrapingEnabled) return offers;

		const output: ExternalProductOffer[] = [];
		for (let index = 0; index < offers.length; index += scrapeConcurrency) {
			const group = offers.slice(index, index + scrapeConcurrency);
			const resolvedGroup = await Promise.all(group.map((offer) => this.resolveOfferImage(query, offer)));
			output.push(...resolvedGroup);
		}

		return output;
	}

	resolveProductImage(offers: ExternalProductOffer[], catalogImage?: string): string | undefined {
		return catalogImage ?? offers.find((offer) => this.isUsableImageUrl(offer.imageUrl))?.imageUrl;
	}

	private async resolveOfferImage(query: string, offer: ExternalProductOffer): Promise<ExternalProductOffer> {
		if (this.isUsableImageUrl(offer.imageUrl) || !this.isExternalHttpUrl(offer.url)) return offer;

		const imageUrl = await this.resolveFromPage(query, offer.url);
		return imageUrl ? { ...offer, imageUrl } : offer;
	}

	private async resolveFromPage(query: string, pageUrl: string): Promise<string | undefined> {
		const cached = this.readCache(pageUrl);
		if (cached) return cached.value;

		try {
			const response = await fetch(pageUrl, {
				headers: {
					Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
					'User-Agent': 'Mozilla/5.0 (compatible; PriceLensBot/1.0; +https://price-lens.local/product-image-resolver)'
				},
				redirect: 'follow',
				signal: AbortSignal.timeout(scrapeTimeoutMs)
			});

			const contentType = response.headers.get('content-type') ?? '';
			if (!response.ok || !contentType.toLowerCase().includes('text/html')) {
				this.writeCache(pageUrl, undefined);
				return undefined;
			}

			const html = await response.text();
			const imageUrl = this.extractImageUrl(html, pageUrl, query);
			this.writeCache(pageUrl, imageUrl);
			return imageUrl;
		} catch {
			this.writeCache(pageUrl, undefined);
			return undefined;
		}
	}

	private extractImageUrl(html: string, pageUrl: string, query: string): string | undefined {
		const candidates = this.isSearchResultUrl(pageUrl)
			? this.extractProductImgTags(html, query)
			: [...this.extractMetaImages(html), ...this.extractJsonLdImages(html), ...this.extractProductImgTags(html, query)];

		for (const candidate of candidates) {
			const absoluteUrl = this.toAbsoluteImageUrl(candidate, pageUrl);
			if (absoluteUrl && this.isUsableImageUrl(absoluteUrl) && !this.hasConflictingProductSignal(absoluteUrl, query)) {
				return absoluteUrl;
			}
		}

		return undefined;
	}

	private extractMetaImages(html: string): string[] {
		const metaImages: string[] = [];
		const metaPattern =
			/<meta\s+[^>]*(?:property|name)=["'](?:og:image|og:image:secure_url|twitter:image|twitter:image:src)["'][^>]*>/gi;

		for (const match of html.matchAll(metaPattern)) {
			const content = this.attributeValue(match[0], 'content');
			if (content) metaImages.push(this.decodeHtml(content));
		}

		return metaImages;
	}

	private extractJsonLdImages(html: string): string[] {
		const images: string[] = [];
		const scriptPattern = /<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;

		for (const match of html.matchAll(scriptPattern)) {
			const jsonText = this.decodeHtml(match[1] ?? '').trim();
			if (!jsonText) continue;

			try {
				this.collectJsonLdImages(JSON.parse(jsonText) as unknown, images);
			} catch {
				for (const imageMatch of jsonText.matchAll(/"image"\s*:\s*"([^"]+)"/gi)) {
					images.push(this.decodeHtml(imageMatch[1] ?? ''));
				}
			}
		}

		return images;
	}

	private collectJsonLdImages(value: unknown, output: string[]): void {
		if (typeof value === 'string') return;
		if (Array.isArray(value)) {
			for (const item of value) this.collectJsonLdImages(item, output);
			return;
		}
		if (!value || typeof value !== 'object') return;

		const record = value as Record<string, unknown>;
		const image = record.image;
		if (typeof image === 'string') output.push(image);
		if (Array.isArray(image)) {
			for (const item of image) {
				if (typeof item === 'string') output.push(item);
				else if (item && typeof item === 'object') {
					const url = (item as Record<string, unknown>).url;
					if (typeof url === 'string') output.push(url);
				}
			}
		}
		if (image && typeof image === 'object' && !Array.isArray(image)) {
			const url = (image as Record<string, unknown>).url;
			if (typeof url === 'string') output.push(url);
		}
		for (const item of Object.values(record)) this.collectJsonLdImages(item, output);
	}

	private extractProductImgTags(html: string, query: string): string[] {
		const queryTokens = this.significantTokens(query);
		const images: string[] = [];
		const imagePattern = /<img\s+[^>]*>/gi;

		for (const match of html.matchAll(imagePattern)) {
			const tag = match[0];
			const label = [this.attributeValue(tag, 'alt'), this.attributeValue(tag, 'title'), this.attributeValue(tag, 'aria-label')]
				.filter(Boolean)
				.join(' ')
				.toLowerCase();
			const hasProductSignal =
				queryTokens.some((token) => label.includes(token)) || /\b(product|primary|main|gallery|item)\b/i.test(tag);

			if (!hasProductSignal) continue;

			const source =
				this.attributeValue(tag, 'src') ??
				this.attributeValue(tag, 'data-src') ??
				this.attributeValue(tag, 'data-original') ??
				this.attributeValue(tag, 'data-lazy-src');
			if (source) images.push(this.decodeHtml(source));
		}

		return images;
	}

	private attributeValue(tag: string, attribute: string): string | undefined {
		const pattern = new RegExp(`${attribute}\\s*=\\s*["']([^"']+)["']`, 'i');
		return tag.match(pattern)?.[1];
	}

	private toAbsoluteImageUrl(value: string, pageUrl: string): string | undefined {
		const trimmed = value.trim();
		if (!trimmed) return undefined;
		try {
			return new URL(trimmed, pageUrl).toString();
		} catch {
			return undefined;
		}
	}

	private isExternalHttpUrl(value?: string): boolean {
		if (!value) return false;
		try {
			const url = new URL(value);
			return url.protocol === 'http:' || url.protocol === 'https:';
		} catch {
			return false;
		}
	}

	private isSearchResultUrl(value: string): boolean {
		const normalized = value.toLowerCase();
		return [
			'/search',
			'/catalog',
			'/catalogsearch',
			'/wholesale',
			'/trade/search',
			'/sch/i',
			'/s?',
			'/ps/',
			'/p/pl',
			'search?',
			'search_',
			'search_result',
			'_nkw=',
			'searchtext=',
			'searchterm=',
			'keyword=',
			'?q=',
			'&q=',
			'?p='
		].some((marker) => normalized.includes(marker));
	}

	private isUsableImageUrl(value?: string): boolean {
		if (!value || !this.isExternalHttpUrl(value)) return false;
		const normalized = value.toLowerCase();
		return !['data:', 'base64', 'logo', 'icon', 'sprite', 'favicon', 'placeholder', 'blank', '.svg'].some((marker) =>
			normalized.includes(marker)
		);
	}

	private hasConflictingProductSignal(imageUrl: string, query: string): boolean {
		const normalizedImage = imageUrl.toLowerCase();
		const normalizedQuery = query.toLowerCase();
		const conflictGroups = [
			['iphone', 'ip15', 'ip14', 'ip13', 'ip12'],
			['samsung', 'galaxy', 's24', 's23', 's22'],
			['pixel', 'google'],
			['macbook'],
			['airpods']
		];
		const queryGroupIndex = conflictGroups.findIndex((group) => group.some((token) => normalizedQuery.includes(token)));

		return conflictGroups.some((group, index) => {
			if (index === queryGroupIndex) return false;
			return group.some((token) => normalizedImage.includes(token));
		});
	}

	private readCache(pageUrl: string): CachedImage | undefined {
		const cached = this.cache.get(pageUrl);
		if (!cached) return undefined;
		if (cached.expiresAt < Date.now()) {
			this.cache.delete(pageUrl);
			return undefined;
		}
		return cached;
	}

	private writeCache(pageUrl: string, value?: string): void {
		this.cache.set(pageUrl, {
			expiresAt: Date.now() + cacheTtlMs,
			value
		});
	}

	private decodeHtml(value: string): string {
		return value
			.replace(/&amp;/g, '&')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'")
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>');
	}

	private significantTokens(value: string): string[] {
		return value
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, ' ')
			.split(' ')
			.filter((token) => token.length > 2)
			.filter((token) => !['with', 'and', 'the', 'for', 'from'].includes(token));
	}
}
