import { mapBrand } from '../../brands/services/brands.service';
import { Category } from '../../categories/entities/category.entity';
import { Product } from '../entities/product.entity';
import { ProductResponseDto } from '../dto/product-response.dto';

const mapCategory = (category: Category) => ({
	id: category.id,
	name: category.name,
	slug: category.slug,
	description: category.description,
	parentId: category.parentId,
	imageUrl: category.imageUrl,
	isActive: category.isActive,
	sortOrder: category.sortOrder
});

export const mapProduct = (product: Product): ProductResponseDto => ({
	id: product.id,
	name: product.name,
	slug: product.slug,
	description: product.description,
	shortDescription: product.shortDescription,
	status: product.status,
	brand: product.brand ? mapBrand(product.brand) : null,
	categories: (product.categories ?? []).map(mapCategory),
	images: (product.images ?? [])
		.sort((a, b) => a.sortOrder - b.sortOrder)
		.map((image) => ({
			id: image.id,
			url: image.url,
			altText: image.altText,
			sortOrder: image.sortOrder,
			isPrimary: image.isPrimary
		})),
	variants: (product.variants ?? []).map((variant) => {
		const inventory = variant.inventoryItem;
		return {
			id: variant.id,
			sku: variant.sku,
			barcode: variant.barcode,
			name: variant.name,
			options: variant.options,
			price: variant.price,
			compareAtPrice: variant.compareAtPrice,
			currency: variant.currency,
			isActive: variant.isActive,
			quantityAvailable: inventory ? inventory.quantityOnHand - inventory.quantityReserved : 0
		};
	}),
	averageRating: 0,
	reviewCount: 0
});
