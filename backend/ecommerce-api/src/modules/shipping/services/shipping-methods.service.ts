import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { CreateShippingMethodDto, ShippingMethodResponseDto, UpdateShippingMethodDto } from '../dto/shipping-method.dto';
import { ShippingMethod } from '../entities/shipping-method.entity';

const mapShippingMethod = (method: ShippingMethod): ShippingMethodResponseDto => ({
	id: method.id,
	name: method.name,
	code: method.code,
	description: method.description,
	price: method.price,
	currency: method.currency,
	estimatedMinDays: method.estimatedMinDays,
	estimatedMaxDays: method.estimatedMaxDays,
	isActive: method.isActive
});

@Injectable()
export class ShippingMethodsService {
	constructor(
		@InjectRepository(ShippingMethod)
		private readonly repository: Repository<ShippingMethod>
	) {}

	async listPublic(): Promise<ShippingMethodResponseDto[]> {
		return (
			await this.repository.find({
				where: { isActive: true },
				order: { price: 'ASC', name: 'ASC' }
			})
		).map(mapShippingMethod);
	}

	async listAdmin(): Promise<ShippingMethodResponseDto[]> {
		return (await this.repository.find({ order: { createdAt: 'DESC' } })).map(mapShippingMethod);
	}

	async create(dto: CreateShippingMethodDto): Promise<ShippingMethodResponseDto> {
		const existing = await this.repository.findOne({
			where: { code: dto.code.trim().toUpperCase() }
		});
		if (existing) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Shipping method code already exists'
			});
		}

		return mapShippingMethod(
			await this.repository.save(
				this.repository.create({
					...dto,
					code: dto.code.trim().toUpperCase(),
					description: dto.description ?? null,
					currency: dto.currency ?? 'AUD',
					isActive: dto.isActive ?? true
				})
			)
		);
	}

	async update(id: string, dto: UpdateShippingMethodDto): Promise<ShippingMethodResponseDto> {
		const method = await this.findEntity(id);
		Object.assign(method, {
			...dto,
			code: dto.code ? dto.code.trim().toUpperCase() : method.code
		});
		return mapShippingMethod(await this.repository.save(method));
	}

	async delete(id: string): Promise<{ status: string }> {
		await this.repository.remove(await this.findEntity(id));
		return { status: 'deleted' };
	}

	async findActive(id: string): Promise<ShippingMethod> {
		const method = await this.repository.findOne({
			where: { id, isActive: true }
		});
		if (!method) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Shipping method was not found'
			});
		}
		return method;
	}

	private async findEntity(id: string): Promise<ShippingMethod> {
		const method = await this.repository.findOne({ where: { id } });
		if (!method) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Shipping method was not found'
			});
		}
		return method;
	}
}
