import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createPaginationMeta } from '../../../common/utils/pagination.util';
import { createSlug } from '../../../common/utils/slug.util';
import { BrandsService } from '../../brands/services/brands.service';
import { CategoriesService } from '../../categories/services/categories.service';
import { InventoryItem } from '../../inventory/entities/inventory-item.entity';
import { ProductQueryDto } from '../dto/product-query.dto';
import { CreateProductDto, CreateProductImageDto, CreateProductVariantDto } from '../dto/create-product.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateProductImageDto } from '../dto/update-product-image.dto';
import { ProductImage } from '../entities/product-image.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Product } from '../entities/product.entity';
import { ProductStatus } from '../enums/product-status.enum';
import { mapProduct } from '../mappers/product.mapper';

@Injectable()
export class ProductsService {
	constructor(
		private readonly dataSource: DataSource,
		private readonly brandsService: BrandsService,
		private readonly categoriesService: CategoriesService,
		@InjectRepository(Product)
		private readonly productsRepository: Repository<Product>,
		@InjectRepository(ProductVariant)
		private readonly variantsRepository: Repository<ProductVariant>,
		@InjectRepository(ProductImage)
		private readonly imagesRepository: Repository<ProductImage>,
		@InjectRepository(InventoryItem)
		private readonly inventoryRepository: Repository<InventoryItem>
	) {}

	async listPublic(query: ProductQueryDto) {
		return this.listProducts(query, true);
	}

	async listAdmin(query: ProductQueryDto) {
		return this.listProducts(query, false);
	}

	async getPublicById(id: string) {
		const product = await this.findHydratedById(id, true);
		return mapProduct(product);
	}

	async getPublicBySlug(slug: string) {
		const product = await this.findHydratedBySlug(slug, true);
		return mapProduct(product);
	}

	async getAdminById(id: string) {
		return mapProduct(await this.findHydratedById(id, false));
	}

	async create(dto: CreateProductDto) {
		await this.assertSlugAvailable(createSlug(dto.slug ?? dto.name));
		await this.assertSkusAvailable(dto.variants.map((variant) => variant.sku));
		const categories = await this.categoriesService.findByIds(dto.categoryIds ?? []);
		const brand = dto.brandId ? await this.brandsService.findEntityByIdOrFail(dto.brandId) : null;

		const product = await this.dataSource.transaction(async (manager) => {
			const savedProduct = await manager.save(
				manager.create(Product, {
					name: dto.name,
					slug: createSlug(dto.slug ?? dto.name),
					description: dto.description ?? null,
					shortDescription: dto.shortDescription ?? null,
					brandId: brand?.id ?? null,
					brand,
					categories,
					status: dto.status ?? ProductStatus.Draft,
					seoTitle: dto.seoTitle ?? null,
					seoDescription: dto.seoDescription ?? null
				})
			);

			for (const imageDto of dto.images ?? []) {
				await manager.save(manager.create(ProductImage, this.imageInput(savedProduct.id, imageDto)));
			}

			for (const variantDto of dto.variants) {
				const variant = await manager.save(manager.create(ProductVariant, this.variantInput(savedProduct.id, variantDto)));
				await manager.save(
					manager.create(InventoryItem, {
						variantId: variant.id,
						quantityOnHand: variantDto.quantityOnHand ?? 0,
						quantityReserved: 0,
						reorderLevel: 0
					})
				);
			}

			return savedProduct;
		});

		return this.getAdminById(product.id);
	}

	async update(id: string, dto: UpdateProductDto) {
		const product = await this.findHydratedById(id, false);
		if (dto.slug || dto.name) {
			const slug = createSlug(dto.slug ?? dto.name ?? product.name);
			if (slug !== product.slug) {
				await this.assertSlugAvailable(slug);
			}
			product.slug = slug;
		}

		product.name = dto.name ?? product.name;
		product.description = dto.description ?? product.description;
		product.shortDescription = dto.shortDescription ?? product.shortDescription;
		product.status = dto.status ?? product.status;
		product.seoTitle = dto.seoTitle ?? product.seoTitle;
		product.seoDescription = dto.seoDescription ?? product.seoDescription;
		product.brand = dto.brandId ? await this.brandsService.findEntityByIdOrFail(dto.brandId) : product.brand;
		product.brandId = product.brand?.id ?? null;
		if (dto.categoryIds) {
			product.categories = await this.categoriesService.findByIds(dto.categoryIds);
		}

		await this.productsRepository.save(product);
		return this.getAdminById(id);
	}

	async delete(id: string) {
		const product = await this.findHydratedById(id, false);
		await this.productsRepository.softRemove(product);
		return { status: 'deleted' };
	}

	async addImage(id: string, dto: CreateProductImageDto) {
		await this.findHydratedById(id, false);
		const image = await this.imagesRepository.save(this.imagesRepository.create(this.imageInput(id, dto)));
		return image;
	}

	async deleteImage(id: string, imageId: string) {
		const image = await this.imagesRepository.findOne({
			where: { id: imageId, productId: id }
		});
		if (!image) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Product image was not found'
			});
		}
		await this.imagesRepository.remove(image);
		return { status: 'deleted' };
	}

	async updateImage(id: string, imageId: string, dto: UpdateProductImageDto) {
		const image = await this.imagesRepository.findOne({
			where: { id: imageId, productId: id }
		});
		if (!image) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Product image was not found'
			});
		}

		image.url = dto.url ?? image.url;
		image.altText = dto.altText ?? image.altText;
		image.sortOrder = dto.sortOrder ?? image.sortOrder;
		image.isPrimary = dto.isPrimary ?? image.isPrimary;

		return this.imagesRepository.save(image);
	}

	async addVariant(id: string, dto: CreateProductVariantDto) {
		await this.findHydratedById(id, false);
		await this.assertSkusAvailable([dto.sku]);
		const variant = await this.dataSource.transaction(async (manager) => {
			const saved = await manager.save(manager.create(ProductVariant, this.variantInput(id, dto)));
			await manager.save(
				manager.create(InventoryItem, {
					variantId: saved.id,
					quantityOnHand: dto.quantityOnHand ?? 0,
					quantityReserved: 0,
					reorderLevel: 0
				})
			);
			return saved;
		});
		return variant;
	}

	async updateVariant(id: string, variantId: string, dto: Partial<CreateProductVariantDto>) {
		const variant = await this.variantsRepository.findOne({
			where: { id: variantId, productId: id }
		});
		if (!variant) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product variant was not found'
			});
		}
		if (dto.sku && dto.sku !== variant.sku) {
			await this.assertSkusAvailable([dto.sku]);
			variant.sku = dto.sku;
		}
		variant.barcode = dto.barcode ?? variant.barcode;
		variant.name = dto.name ?? variant.name;
		variant.options = dto.options ?? variant.options;
		variant.price = dto.price ?? variant.price;
		variant.compareAtPrice = dto.compareAtPrice ?? variant.compareAtPrice;
		variant.costPrice = dto.costPrice ?? variant.costPrice;
		variant.currency = dto.currency ?? variant.currency;
		variant.weight = dto.weight ?? variant.weight;
		variant.isActive = dto.isActive ?? variant.isActive;
		const saved = await this.variantsRepository.save(variant);

		if (dto.quantityOnHand !== undefined) {
			const inventoryItem = await this.inventoryRepository.findOne({
				where: { variantId }
			});
			if (inventoryItem) {
				inventoryItem.quantityOnHand = dto.quantityOnHand;
				await this.inventoryRepository.save(inventoryItem);
			}
		}

		return saved;
	}

	async deleteVariant(id: string, variantId: string) {
		const variant = await this.variantsRepository.findOne({
			where: { id: variantId, productId: id }
		});
		if (!variant) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product variant was not found'
			});
		}
		await this.variantsRepository.remove(variant);
		return { status: 'deleted' };
	}

	private async listProducts(query: ProductQueryDto, publicOnly: boolean) {
		const builder = this.productsRepository
			.createQueryBuilder('product')
			.leftJoinAndSelect('product.brand', 'brand')
			.leftJoinAndSelect('product.categories', 'category')
			.leftJoinAndSelect('product.images', 'image')
			.leftJoinAndSelect('product.variants', 'variant')
			.leftJoinAndSelect('variant.inventoryItem', 'inventory')
			.skip((query.page - 1) * query.limit)
			.take(query.limit);

		if (publicOnly) {
			builder.andWhere('product.status = :status', {
				status: ProductStatus.Active
			});
			builder.andWhere('variant.is_active = true');
		}
		if (query.search) {
			builder.andWhere('(product.name ILIKE :search OR product.description ILIKE :search OR variant.sku ILIKE :search)', {
				search: `%${query.search}%`
			});
		}
		if (query.category) {
			builder.andWhere('category.slug = :category', {
				category: query.category
			});
		}
		if (query.brand) {
			builder.andWhere('brand.slug = :brand', { brand: query.brand });
		}
		if (query.minPrice !== undefined) {
			builder.andWhere('variant.price >= :minPrice', {
				minPrice: query.minPrice
			});
		}
		if (query.maxPrice !== undefined) {
			builder.andWhere('variant.price <= :maxPrice', {
				maxPrice: query.maxPrice
			});
		}
		if (query.inStock) {
			builder.andWhere('(inventory.quantity_on_hand - inventory.quantity_reserved) > 0');
		}

		const order = query.sortOrder.toUpperCase() as 'ASC' | 'DESC';
		if (query.sortBy === 'price') {
			builder.orderBy('MIN(variant.price)', order);
			builder.addGroupBy('product.id, brand.id, category.id, image.id, variant.id, inventory.id');
		} else if (query.sortBy === 'name') {
			builder.orderBy('product.name', order);
		} else {
			builder.orderBy('product.createdAt', order);
		}

		const [products, total] = await builder.getManyAndCount();
		return {
			items: products.map(mapProduct),
			meta: createPaginationMeta(query.page, query.limit, total)
		};
	}

	private async findHydratedById(id: string, publicOnly: boolean): Promise<Product> {
		const builder = this.hydratedBuilder().where('product.id = :id', { id });
		if (publicOnly) {
			builder.andWhere('product.status = :status', {
				status: ProductStatus.Active
			});
		}
		const product = await builder.getOne();
		if (!product) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product was not found'
			});
		}
		return product;
	}

	private async findHydratedBySlug(slug: string, publicOnly: boolean): Promise<Product> {
		const builder = this.hydratedBuilder().where('product.slug = :slug', {
			slug
		});
		if (publicOnly) {
			builder.andWhere('product.status = :status', {
				status: ProductStatus.Active
			});
		}
		const product = await builder.getOne();
		if (!product) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product was not found'
			});
		}
		return product;
	}

	private hydratedBuilder() {
		return this.productsRepository
			.createQueryBuilder('product')
			.leftJoinAndSelect('product.brand', 'brand')
			.leftJoinAndSelect('product.categories', 'category')
			.leftJoinAndSelect('product.images', 'image')
			.leftJoinAndSelect('product.variants', 'variant')
			.leftJoinAndSelect('variant.inventoryItem', 'inventory');
	}

	private async assertSlugAvailable(slug: string): Promise<void> {
		if (
			await this.productsRepository.exists({
				where: { slug },
				withDeleted: true
			})
		) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Product slug already exists'
			});
		}
	}

	private async assertSkusAvailable(skus: string[]): Promise<void> {
		const existing = await this.variantsRepository
			.createQueryBuilder('variant')
			.where('variant.sku IN (:...skus)', { skus })
			.getCount();
		if (existing > 0) {
			throw new ConflictException({
				errorCode: ErrorCode.ProductSkuExists,
				message: 'Product SKU already exists'
			});
		}
	}

	private imageInput(productId: string, dto: CreateProductImageDto) {
		return {
			productId,
			url: dto.url,
			altText: dto.altText ?? null,
			sortOrder: dto.sortOrder ?? 0,
			isPrimary: dto.isPrimary ?? false
		};
	}

	private variantInput(productId: string, dto: CreateProductVariantDto) {
		return {
			productId,
			sku: dto.sku,
			barcode: dto.barcode ?? null,
			name: dto.name,
			options: dto.options ?? {},
			price: dto.price,
			compareAtPrice: dto.compareAtPrice ?? null,
			costPrice: dto.costPrice ?? null,
			currency: dto.currency ?? 'AUD',
			weight: dto.weight ?? null,
			isActive: dto.isActive ?? true
		};
	}
}
