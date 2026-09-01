import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createSlug } from '../../../common/utils/slug.util';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { Brand } from '../entities/brand.entity';

export const mapBrand = (brand: Brand): BrandResponseDto => ({
	id: brand.id,
	name: brand.name,
	slug: brand.slug,
	description: brand.description,
	logoUrl: brand.logoUrl,
	websiteUrl: brand.websiteUrl,
	isActive: brand.isActive
});

@Injectable()
export class BrandsService {
	constructor(
		@InjectRepository(Brand)
		private readonly brandsRepository: Repository<Brand>
	) {}

	async listPublic(): Promise<BrandResponseDto[]> {
		return (
			await this.brandsRepository.find({
				where: { isActive: true },
				order: { name: 'ASC' }
			})
		).map(mapBrand);
	}

	async getBySlug(slug: string): Promise<BrandResponseDto> {
		const brand = await this.brandsRepository.findOne({
			where: { slug, isActive: true }
		});
		if (!brand) {
			throw new NotFoundException({
				errorCode: ErrorCode.BrandNotFound,
				message: 'Brand was not found'
			});
		}
		return mapBrand(brand);
	}

	async create(dto: CreateBrandDto): Promise<BrandResponseDto> {
		const slug = createSlug(dto.slug ?? dto.name);
		await this.assertSlugAvailable(slug);
		const brand = this.brandsRepository.create({
			name: dto.name,
			slug,
			description: dto.description ?? null,
			logoUrl: dto.logoUrl ?? null,
			websiteUrl: dto.websiteUrl ?? null,
			isActive: dto.isActive ?? true
		});
		return mapBrand(await this.brandsRepository.save(brand));
	}

	async update(id: string, dto: UpdateBrandDto): Promise<BrandResponseDto> {
		const brand = await this.findEntityByIdOrFail(id);
		if (dto.slug || dto.name) {
			const slug = createSlug(dto.slug ?? dto.name ?? brand.name);
			if (slug !== brand.slug) {
				await this.assertSlugAvailable(slug);
			}
			brand.slug = slug;
		}
		brand.name = dto.name ?? brand.name;
		brand.description = dto.description ?? brand.description;
		brand.logoUrl = dto.logoUrl ?? brand.logoUrl;
		brand.websiteUrl = dto.websiteUrl ?? brand.websiteUrl;
		brand.isActive = dto.isActive ?? brand.isActive;
		return mapBrand(await this.brandsRepository.save(brand));
	}

	async delete(id: string): Promise<{ status: string }> {
		await this.brandsRepository.remove(await this.findEntityByIdOrFail(id));
		return { status: 'deleted' };
	}

	async findEntityByIdOrFail(id: string): Promise<Brand> {
		const brand = await this.brandsRepository.findOne({ where: { id } });
		if (!brand) {
			throw new NotFoundException({
				errorCode: ErrorCode.BrandNotFound,
				message: 'Brand was not found'
			});
		}
		return brand;
	}

	private async assertSlugAvailable(slug: string): Promise<void> {
		if (await this.brandsRepository.exists({ where: { slug } })) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Brand slug already exists'
			});
		}
	}
}
