export interface ProductSourceSearchContext {
	productId: string;
	name: string;
	brand?: string;
	model?: string;
	variant?: string;
	storage?: string;
	color?: string;
	sku?: string;
	barcode?: string;
	price: number;
	currency: string;
}

export interface ProductSearchContext {
	query: string;
	currency: string;
}

export interface ExternalProductOffer {
	store: string;
	title: string;
	region?: string;
	countryCode?: string;
	brand?: string;
	model?: string;
	variant?: string;
	storage?: string;
	color?: string;
	sku?: string;
	barcode?: string;
	price: number;
	shippingCost?: number;
	currency: string;
	availability?: string;
	rating?: number;
	url: string;
	imageUrl?: string;
}

export interface ProductSource {
	readonly name: string;
	search(query: string, context: ProductSourceSearchContext): Promise<ExternalProductOffer[]>;
	searchByName?(query: string, context: ProductSearchContext): Promise<ExternalProductOffer[]>;
}

export const PRODUCT_SOURCES = Symbol('PRODUCT_SOURCES');
