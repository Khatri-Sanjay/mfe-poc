import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ReviewStatus } from '../enums/review-status.enum';

export class ReviewResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty()
	productId!: string;
	@ApiProperty()
	userId!: string;
	@ApiProperty()
	rating!: number;
	@ApiProperty()
	title!: string;
	@ApiProperty({ nullable: true })
	comment!: string | null;
	@ApiProperty({ enum: ReviewStatus })
	status!: ReviewStatus;
	@ApiProperty()
	verifiedPurchase!: boolean;
}

export class CreateReviewDto {
	@ApiProperty({ minimum: 1, maximum: 5 })
	@IsInt()
	@Min(1)
	@Max(5)
	rating!: number;
	@ApiProperty()
	@IsString()
	@MaxLength(160)
	title!: string;
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	comment?: string;
}

export class UpdateReviewDto {
	@ApiPropertyOptional({ minimum: 1, maximum: 5 })
	@IsInt()
	@Min(1)
	@Max(5)
	@IsOptional()
	rating?: number;
	@ApiPropertyOptional()
	@IsString()
	@MaxLength(160)
	@IsOptional()
	title?: string;
	@ApiPropertyOptional()
	@IsString()
	@IsOptional()
	comment?: string;
}

export class AdminReviewQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ enum: ReviewStatus })
	@IsEnum(ReviewStatus)
	@IsOptional()
	status?: ReviewStatus;
}

export class UpdateReviewStatusDto {
	@ApiProperty({ enum: ReviewStatus })
	@IsEnum(ReviewStatus)
	status!: ReviewStatus;
}
