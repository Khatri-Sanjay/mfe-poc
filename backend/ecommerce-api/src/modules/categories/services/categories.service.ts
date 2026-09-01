import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createSlug } from '../../../common/utils/slug.util';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { Category } from '../entities/category.entity';

const mapCategory = (category: Category): CategoryResponseDto => ({
	id: category.id,
	name: category.name,
	slug: category.slug,
	description: category.description,
	parentId: category.parentId,
	imageUrl: category.imageUrl,
	isActive: category.isActive,
	sortOrder: category.sortOrder
});

@Injectable()
export class CategoriesService {
	constructor(
		@InjectRepository(Category)
		private readonly categoriesRepository: Repository<Category>
	) {}

	async listPublic(): Promise<CategoryResponseDto[]> {
		const categories = await this.categoriesRepository.find({
			where: { isActive: true },
			order: { sortOrder: 'ASC', name: 'ASC' }
		});
		return categories.map(mapCategory);
	}

	async getBySlug(slug: string): Promise<CategoryResponseDto> {
		const category = await this.categoriesRepository.findOne({
			where: { slug, isActive: true }
		});

		if (!category) {
			throw new NotFoundException({
				errorCode: ErrorCode.CategoryNotFound,
				message: 'Category was not found'
			});
		}

		return mapCategory(category);
	}

	async create(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
		const slug = createSlug(dto.slug ?? dto.name);
		await this.assertSlugAvailable(slug);
		if (dto.parentId) {
			await this.findEntityByIdOrFail(dto.parentId);
		}

		const category = this.categoriesRepository.create({
			name: dto.name,
			slug,
			description: dto.description ?? null,
			parentId: dto.parentId ?? null,
			imageUrl: dto.imageUrl ?? null,
			isActive: dto.isActive ?? true,
			sortOrder: dto.sortOrder ?? 0
		});

		return mapCategory(await this.categoriesRepository.save(category));
	}

	async update(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
		const category = await this.findEntityByIdOrFail(id);

		if (dto.slug || dto.name) {
			const slug = createSlug(dto.slug ?? dto.name ?? category.name);
			if (slug !== category.slug) {
				await this.assertSlugAvailable(slug);
			}
			category.slug = slug;
		}

		if (dto.parentId !== undefined) {
			await this.assertValidParent(id, dto.parentId);
			category.parentId = dto.parentId ?? null;
		}

		category.name = dto.name ?? category.name;
		category.description = dto.description ?? category.description;
		category.imageUrl = dto.imageUrl ?? category.imageUrl;
		category.isActive = dto.isActive ?? category.isActive;
		category.sortOrder = dto.sortOrder ?? category.sortOrder;

		return mapCategory(await this.categoriesRepository.save(category));
	}

	async delete(id: string): Promise<{ status: string }> {
		const category = await this.findEntityByIdOrFail(id);
		await this.categoriesRepository.remove(category);
		return { status: 'deleted' };
	}

	async findByIds(ids: string[]): Promise<Category[]> {
		if (ids.length === 0) {
			return [];
		}

		const categories = await this.categoriesRepository
			.createQueryBuilder('category')
			.where('category.id IN (:...ids)', { ids })
			.getMany();

		if (categories.length !== ids.length) {
			throw new NotFoundException({
				errorCode: ErrorCode.CategoryNotFound,
				message: 'One or more categories were not found'
			});
		}

		return categories;
	}

	private async findEntityByIdOrFail(id: string): Promise<Category> {
		const category = await this.categoriesRepository.findOne({ where: { id } });
		if (!category) {
			throw new NotFoundException({
				errorCode: ErrorCode.CategoryNotFound,
				message: 'Category was not found'
			});
		}
		return category;
	}

	private async assertSlugAvailable(slug: string): Promise<void> {
		const exists = await this.categoriesRepository.exists({ where: { slug } });
		if (exists) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Category slug already exists'
			});
		}
	}

	private async assertValidParent(categoryId: string, parentId?: string): Promise<void> {
		if (!parentId) {
			return;
		}
		if (categoryId === parentId) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Category cannot be its own parent'
			});
		}

		let current: Category | null = await this.findEntityByIdOrFail(parentId);
		while (current?.parentId) {
			if (current.parentId === categoryId) {
				throw new ConflictException({
					errorCode: ErrorCode.Conflict,
					message: 'Circular category relationship is not allowed'
				});
			}
			current = await this.categoriesRepository.findOne({
				where: { id: current.parentId }
			});
		}
	}
}
