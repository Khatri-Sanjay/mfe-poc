import { Injectable } from '@nestjs/common';
import type {
	ExternalProductOffer,
	ProductSearchContext,
	ProductSource,
	ProductSourceSearchContext
} from '../interfaces/product-source.interface';

type MarketplaceDefinition = {
	store: string;
	region: string;
	countryCode: string;
	currency: string;
	searchUrl: (query: string) => string;
	priceMultiplier: number;
	shippingMultiplier: number;
	ratingBase: number;
};

const round = (value: number): number => Math.round(value * 100) / 100;
const usdToCurrency: Record<string, number> = {
	USD: 1,
	NPR: 133,
	INR: 83,
	GBP: 0.79,
	CNY: 7.1,
	JPY: 150
};

const marketplaces: MarketplaceDefinition[] = [
	{ store: 'Amazon Global', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 1.01, shippingMultiplier: 0.02, ratingBase: 4.5, searchUrl: (query) => `https://www.amazon.com/s?k=${query}` },
	{ store: 'eBay', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 0.95, shippingMultiplier: 0.04, ratingBase: 4.2, searchUrl: (query) => `https://www.ebay.com/sch/i.html?_nkw=${query}` },
	{ store: 'Alibaba', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 0.82, shippingMultiplier: 0.08, ratingBase: 4.1, searchUrl: (query) => `https://www.alibaba.com/trade/search?SearchText=${query}` },
	{ store: 'AliExpress', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 0.88, shippingMultiplier: 0.06, ratingBase: 4.3, searchUrl: (query) => `https://www.aliexpress.com/wholesale?SearchText=${query}` },
	{ store: 'Walmart Global', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 0.99, shippingMultiplier: 0.02, ratingBase: 4.2, searchUrl: (query) => `https://www.walmart.com/search?q=${query}` },
	{ store: 'Etsy', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 1.08, shippingMultiplier: 0.05, ratingBase: 4.6, searchUrl: (query) => `https://www.etsy.com/search?q=${query}` },
	{ store: 'Shopify Stores', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 1.04, shippingMultiplier: 0.03, ratingBase: 4.2, searchUrl: (query) => `https://www.google.com/search?q=site%3Amyshopify.com+${query}` },
	{ store: 'Temu', region: 'Global', countryCode: 'GLOBAL', currency: 'USD', priceMultiplier: 0.78, shippingMultiplier: 0.04, ratingBase: 4.0, searchUrl: (query) => `https://www.temu.com/search_result.html?search_key=${query}` },
	{ store: 'Daraz', region: 'Nepal', countryCode: 'NP', currency: 'NPR', priceMultiplier: 0.97, shippingMultiplier: 0.01, ratingBase: 4.1, searchUrl: (query) => `https://www.daraz.com.np/catalog/?q=${query}` },
	{ store: 'Sastodeal', region: 'Nepal', countryCode: 'NP', currency: 'NPR', priceMultiplier: 0.94, shippingMultiplier: 0.015, ratingBase: 4.0, searchUrl: (query) => `https://www.sastodeal.com/catalogsearch/result/?q=${query}` },
	{ store: 'Gyapu', region: 'Nepal', countryCode: 'NP', currency: 'NPR', priceMultiplier: 0.98, shippingMultiplier: 0.01, ratingBase: 4.0, searchUrl: (query) => `https://www.gyapu.com/search?keyword=${query}` },
	{ store: 'Thulo', region: 'Nepal', countryCode: 'NP', currency: 'NPR', priceMultiplier: 1.02, shippingMultiplier: 0.012, ratingBase: 3.9, searchUrl: (query) => `https://thulo.com/catalogsearch/result/?q=${query}` },
	{ store: 'Mero Shopping', region: 'Nepal', countryCode: 'NP', currency: 'NPR', priceMultiplier: 1.0, shippingMultiplier: 0.015, ratingBase: 3.9, searchUrl: (query) => `https://www.google.com/search?q=Mero+Shopping+${query}` },
	{ store: 'Flipkart', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 0.92, shippingMultiplier: 0.01, ratingBase: 4.3, searchUrl: (query) => `https://www.flipkart.com/search?q=${query}` },
	{ store: 'Myntra', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 0.96, shippingMultiplier: 0.012, ratingBase: 4.1, searchUrl: (query) => `https://www.myntra.com/${query}` },
	{ store: 'Meesho', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 0.84, shippingMultiplier: 0.015, ratingBase: 4.0, searchUrl: (query) => `https://www.meesho.com/search?q=${query}` },
	{ store: 'AJIO', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 0.98, shippingMultiplier: 0.012, ratingBase: 4.1, searchUrl: (query) => `https://www.ajio.com/search/?text=${query}` },
	{ store: 'Nykaa', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 1.0, shippingMultiplier: 0.01, ratingBase: 4.2, searchUrl: (query) => `https://www.nykaa.com/search/result/?q=${query}` },
	{ store: 'Tata CLiQ', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 1.02, shippingMultiplier: 0.01, ratingBase: 4.2, searchUrl: (query) => `https://www.tatacliq.com/search/?searchCategory=all&text=${query}` },
	{ store: 'BigBasket', region: 'India', countryCode: 'IN', currency: 'INR', priceMultiplier: 0.91, shippingMultiplier: 0.01, ratingBase: 4.0, searchUrl: (query) => `https://www.bigbasket.com/ps/?q=${query}` },
	{ store: 'Amazon US', region: 'United States', countryCode: 'US', currency: 'USD', priceMultiplier: 1.0, shippingMultiplier: 0.02, ratingBase: 4.5, searchUrl: (query) => `https://www.amazon.com/s?k=${query}` },
	{ store: 'Walmart US', region: 'United States', countryCode: 'US', currency: 'USD', priceMultiplier: 0.97, shippingMultiplier: 0.02, ratingBase: 4.2, searchUrl: (query) => `https://www.walmart.com/search?q=${query}` },
	{ store: 'Target', region: 'United States', countryCode: 'US', currency: 'USD', priceMultiplier: 1.03, shippingMultiplier: 0.02, ratingBase: 4.2, searchUrl: (query) => `https://www.target.com/s?searchTerm=${query}` },
	{ store: 'Best Buy', region: 'United States', countryCode: 'US', currency: 'USD', priceMultiplier: 1.04, shippingMultiplier: 0.015, ratingBase: 4.4, searchUrl: (query) => `https://www.bestbuy.com/site/searchpage.jsp?st=${query}` },
	{ store: 'Wayfair', region: 'United States', countryCode: 'US', currency: 'USD', priceMultiplier: 1.05, shippingMultiplier: 0.04, ratingBase: 4.1, searchUrl: (query) => `https://www.wayfair.com/keyword.php?keyword=${query}` },
	{ store: 'Newegg', region: 'United States', countryCode: 'US', currency: 'USD', priceMultiplier: 0.99, shippingMultiplier: 0.025, ratingBase: 4.3, searchUrl: (query) => `https://www.newegg.com/p/pl?d=${query}` },
	{ store: 'ASOS', region: 'United Kingdom', countryCode: 'GB', currency: 'GBP', priceMultiplier: 1.02, shippingMultiplier: 0.025, ratingBase: 4.2, searchUrl: (query) => `https://www.asos.com/search/?q=${query}` },
	{ store: 'Argos', region: 'United Kingdom', countryCode: 'GB', currency: 'GBP', priceMultiplier: 1.01, shippingMultiplier: 0.02, ratingBase: 4.1, searchUrl: (query) => `https://www.argos.co.uk/search/${query}/` },
	{ store: 'John Lewis', region: 'United Kingdom', countryCode: 'GB', currency: 'GBP', priceMultiplier: 1.08, shippingMultiplier: 0.02, ratingBase: 4.5, searchUrl: (query) => `https://www.johnlewis.com/search?search-term=${query}` },
	{ store: 'Very', region: 'United Kingdom', countryCode: 'GB', currency: 'GBP', priceMultiplier: 1.0, shippingMultiplier: 0.025, ratingBase: 4.0, searchUrl: (query) => `https://www.very.co.uk/e/q/${query}.end` },
	{ store: 'Taobao', region: 'China', countryCode: 'CN', currency: 'CNY', priceMultiplier: 0.8, shippingMultiplier: 0.06, ratingBase: 4.1, searchUrl: (query) => `https://s.taobao.com/search?q=${query}` },
	{ store: 'JD.com', region: 'China', countryCode: 'CN', currency: 'CNY', priceMultiplier: 0.9, shippingMultiplier: 0.04, ratingBase: 4.3, searchUrl: (query) => `https://search.jd.com/Search?keyword=${query}` },
	{ store: 'Pinduoduo', region: 'China', countryCode: 'CN', currency: 'CNY', priceMultiplier: 0.76, shippingMultiplier: 0.05, ratingBase: 4.0, searchUrl: (query) => `https://mobile.yangkeduo.com/search_result.html?search_key=${query}` },
	{ store: 'Tmall', region: 'China', countryCode: 'CN', currency: 'CNY', priceMultiplier: 0.89, shippingMultiplier: 0.045, ratingBase: 4.3, searchUrl: (query) => `https://list.tmall.com/search_product.htm?q=${query}` },
	{ store: 'Rakuten', region: 'Japan', countryCode: 'JP', currency: 'JPY', priceMultiplier: 0.98, shippingMultiplier: 0.03, ratingBase: 4.2, searchUrl: (query) => `https://search.rakuten.co.jp/search/mall/${query}/` },
	{ store: 'Yahoo! Shopping Japan', region: 'Japan', countryCode: 'JP', currency: 'JPY', priceMultiplier: 0.96, shippingMultiplier: 0.03, ratingBase: 4.1, searchUrl: (query) => `https://shopping.yahoo.co.jp/search?p=${query}` },
	{ store: 'ZOZOTOWN', region: 'Japan', countryCode: 'JP', currency: 'JPY', priceMultiplier: 1.04, shippingMultiplier: 0.025, ratingBase: 4.0, searchUrl: (query) => `https://zozo.jp/search/?p_keyv=${query}` }
];

@Injectable()
export class MarketplaceSearchSource implements ProductSource {
	readonly name = 'Marketplace Search Catalog';

	search(query: string, context: ProductSourceSearchContext): Promise<ExternalProductOffer[]> {
		return this.searchMarketplaces(query, context.currency);
	}

	searchByName(query: string, context: ProductSearchContext): Promise<ExternalProductOffer[]> {
		return this.searchMarketplaces(query, context.currency);
	}

	private searchMarketplaces(query: string, fallbackCurrency: string): Promise<ExternalProductOffer[]> {
		const encodedQuery = encodeURIComponent(query);
		const seed = [...query.toLowerCase()].reduce((sum, char) => sum + char.charCodeAt(0), 0);

		return Promise.resolve(
			marketplaces.map((marketplace, index) => {
				const baseUsd = 120 + (seed % 780) + index * 7;
				const localRate = usdToCurrency[marketplace.currency] ?? usdToCurrency[fallbackCurrency] ?? 1;
				const price = round(baseUsd * marketplace.priceMultiplier * localRate);
				const shippingCost = round(price * marketplace.shippingMultiplier);
				const rating = round(Math.min(4.9, marketplace.ratingBase + ((seed + index) % 6) / 10));

				return {
					store: marketplace.store,
					title: `${query} from ${marketplace.store}`,
					price,
					shippingCost,
					currency: marketplace.currency || fallbackCurrency,
					availability: index % 5 === 0 ? 'Check seller' : 'Available',
					rating,
					url: marketplace.searchUrl(encodedQuery),
					region: marketplace.region,
					countryCode: marketplace.countryCode
				};
			})
		);
	}
}
