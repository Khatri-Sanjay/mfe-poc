import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { centsToMoney, toCents } from '../../../common/utils/money.util';
import { CouponResponseDto, CreateCouponDto, UpdateCouponDto } from '../dto/coupon.dto';
import { Coupon } from '../entities/coupon.entity';
import { CouponType } from '../enums/coupon-type.enum';

export interface CouponCalculation {
	coupon: Coupon;
	discountTotal: string;
	discountTotalCents: number;
}

const normalizeCode = (code: string): string => code.trim().toUpperCase();

const mapCoupon = (coupon: Coupon): CouponResponseDto => ({
	id: coupon.id,
	code: coupon.code,
	type: coupon.type,
	value: coupon.value,
	minimumOrderAmount: coupon.minimumOrderAmount,
	maximumDiscountAmount: coupon.maximumDiscountAmount,
	startsAt: coupon.startsAt,
	expiresAt: coupon.expiresAt,
	usageLimit: coupon.usageLimit,
	usageLimitPerUser: coupon.usageLimitPerUser,
	usageCount: coupon.usageCount,
	isActive: coupon.isActive
});

@Injectable()
export class CouponsService {
	constructor(
		@InjectRepository(Coupon)
		private readonly repository: Repository<Coupon>
	) {}

	async list(): Promise<CouponResponseDto[]> {
		return (await this.repository.find({ order: { createdAt: 'DESC' } })).map(mapCoupon);
	}

	async create(dto: CreateCouponDto): Promise<CouponResponseDto> {
		const code = normalizeCode(dto.code);
		const existing = await this.repository.findOne({ where: { code } });
		if (existing) {
			throw new ConflictException({
				errorCode: ErrorCode.Conflict,
				message: 'Coupon code already exists'
			});
		}
		return mapCoupon(
			await this.repository.save(
				this.repository.create({
					...dto,
					code,
					minimumOrderAmount: dto.minimumOrderAmount ?? null,
					maximumDiscountAmount: dto.maximumDiscountAmount ?? null,
					startsAt: dto.startsAt ? new Date(dto.startsAt) : null,
					expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
					usageLimit: dto.usageLimit ?? null,
					usageLimitPerUser: dto.usageLimitPerUser ?? null,
					isActive: dto.isActive ?? true
				})
			)
		);
	}

	async update(id: string, dto: UpdateCouponDto): Promise<CouponResponseDto> {
		const coupon = await this.findEntity(id);
		Object.assign(coupon, {
			...dto,
			code: dto.code ? normalizeCode(dto.code) : coupon.code,
			startsAt: dto.startsAt ? new Date(dto.startsAt) : coupon.startsAt,
			expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : coupon.expiresAt
		});
		return mapCoupon(await this.repository.save(coupon));
	}

	async delete(id: string): Promise<{ status: string }> {
		await this.repository.remove(await this.findEntity(id));
		return { status: 'deleted' };
	}

	async calculate(code: string, subtotalCents: number): Promise<CouponCalculation> {
		const coupon = await this.repository.findOne({
			where: { code: normalizeCode(code) }
		});
		const now = new Date();

		if (!coupon || !coupon.isActive || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now)) {
			throw new BadRequestException({
				errorCode: ErrorCode.CouponInvalid,
				message: 'Coupon is invalid'
			});
		}

		if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
			throw new BadRequestException({
				errorCode: ErrorCode.CouponInvalid,
				message: 'Coupon is invalid'
			});
		}

		if (coupon.minimumOrderAmount && subtotalCents < toCents(coupon.minimumOrderAmount)) {
			throw new BadRequestException({
				errorCode: ErrorCode.CouponInvalid,
				message: 'Coupon minimum order amount was not met'
			});
		}

		let discountTotalCents =
			coupon.type === CouponType.Percentage ? Math.floor((subtotalCents * Number(coupon.value)) / 100) : toCents(coupon.value);

		if (coupon.maximumDiscountAmount) {
			discountTotalCents = Math.min(discountTotalCents, toCents(coupon.maximumDiscountAmount));
		}

		discountTotalCents = Math.min(discountTotalCents, subtotalCents);
		return {
			coupon,
			discountTotal: centsToMoney(discountTotalCents),
			discountTotalCents
		};
	}

	async incrementUsage(couponId: string): Promise<void> {
		await this.repository.increment({ id: couponId }, 'usageCount', 1);
	}

	private async findEntity(id: string): Promise<Coupon> {
		const coupon = await this.repository.findOne({ where: { id } });
		if (!coupon) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Coupon was not found'
			});
		}
		return coupon;
	}
}
