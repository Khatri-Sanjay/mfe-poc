import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createPaginationMeta } from '../../../common/utils/pagination.util';
import { Order } from '../../orders/entities/order.entity';
import { OrderStatus } from '../../orders/enums/order-status.enum';
import { Product } from '../../products/entities/product.entity';
import { AdminReviewQueryDto, CreateReviewDto, ReviewResponseDto, UpdateReviewDto, UpdateReviewStatusDto } from '../dto/review.dto';
import { Review } from '../entities/review.entity';
import { ReviewStatus } from '../enums/review-status.enum';

const mapReview = (review: Review): ReviewResponseDto => ({
	id: review.id,
	productId: review.productId,
	userId: review.userId,
	rating: review.rating,
	title: review.title,
	comment: review.comment,
	status: review.status,
	verifiedPurchase: review.verifiedPurchase
});

@Injectable()
export class ReviewsService {
	constructor(
		@InjectRepository(Review)
		private readonly reviewRepository: Repository<Review>,
		@InjectRepository(Product)
		private readonly productRepository: Repository<Product>,
		@InjectRepository(Order)
		private readonly orderRepository: Repository<Order>
	) {}

	async listProduct(productId: string, page = 1, limit = 20) {
		const [reviews, total] = await this.reviewRepository.findAndCount({
			where: { productId, status: ReviewStatus.Approved },
			order: { createdAt: 'DESC' },
			skip: (page - 1) * limit,
			take: limit
		});
		return {
			items: reviews.map(mapReview),
			meta: createPaginationMeta(page, limit, total)
		};
	}

	async create(userId: string, productId: string, dto: CreateReviewDto): Promise<ReviewResponseDto> {
		const product = await this.productRepository.findOne({
			where: { id: productId }
		});
		if (!product) {
			throw new NotFoundException({
				errorCode: ErrorCode.ProductNotFound,
				message: 'Product was not found'
			});
		}

		const existing = await this.reviewRepository.findOne({
			where: { userId, productId }
		});
		if (existing) {
			throw new ConflictException({
				errorCode: ErrorCode.ReviewAlreadyExists,
				message: 'Review already exists'
			});
		}

		const verifiedPurchase = await this.hasPurchased(userId, productId);
		return mapReview(
			await this.reviewRepository.save(
				this.reviewRepository.create({
					userId,
					productId,
					rating: dto.rating,
					title: dto.title,
					comment: dto.comment ?? null,
					status: ReviewStatus.Approved,
					verifiedPurchase
				})
			)
		);
	}

	async update(userId: string, id: string, dto: UpdateReviewDto): Promise<ReviewResponseDto> {
		const review = await this.findEntity(id);
		if (review.userId !== userId) {
			throw new ForbiddenException({
				errorCode: ErrorCode.Forbidden,
				message: 'You cannot update this review'
			});
		}
		Object.assign(review, dto);
		return mapReview(await this.reviewRepository.save(review));
	}

	async deleteOwn(userId: string, id: string): Promise<{ status: string }> {
		const review = await this.findEntity(id);
		if (review.userId !== userId) {
			throw new ForbiddenException({
				errorCode: ErrorCode.Forbidden,
				message: 'You cannot delete this review'
			});
		}
		await this.reviewRepository.remove(review);
		return { status: 'deleted' };
	}

	async listAdmin(query: AdminReviewQueryDto) {
		const builder = this.reviewRepository
			.createQueryBuilder('review')
			.orderBy('review.createdAt', 'DESC')
			.skip((query.page - 1) * query.limit)
			.take(query.limit);
		if (query.status) {
			builder.andWhere('review.status = :status', { status: query.status });
		}
		const [reviews, total] = await builder.getManyAndCount();
		return {
			items: reviews.map(mapReview),
			meta: createPaginationMeta(query.page, query.limit, total)
		};
	}

	async updateStatus(id: string, dto: UpdateReviewStatusDto): Promise<ReviewResponseDto> {
		const review = await this.findEntity(id);
		review.status = dto.status;
		return mapReview(await this.reviewRepository.save(review));
	}

	async deleteAdmin(id: string): Promise<{ status: string }> {
		await this.reviewRepository.remove(await this.findEntity(id));
		return { status: 'deleted' };
	}

	private async hasPurchased(userId: string, productId: string): Promise<boolean> {
		const order = await this.orderRepository
			.createQueryBuilder('order')
			.innerJoin('order.items', 'item')
			.where('order.userId = :userId', { userId })
			.andWhere('item.productId = :productId', { productId })
			.andWhere('order.status IN (:...statuses)', {
				statuses: [OrderStatus.Paid, OrderStatus.Processing, OrderStatus.Shipped, OrderStatus.Delivered]
			})
			.getOne();
		return Boolean(order);
	}

	private async findEntity(id: string): Promise<Review> {
		const review = await this.reviewRepository.findOne({ where: { id } });
		if (!review) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Review was not found'
			});
		}
		return review;
	}
}
