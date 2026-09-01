import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CreateReviewDto, ReviewResponseDto, UpdateReviewDto } from '../dto/review.dto';
import { ReviewsService } from '../services/reviews.service';

@ApiTags('Reviews')
@Controller()
export class ReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get('products/:id/reviews')
	@Public()
	@ResponseMessage('Reviews retrieved successfully')
	@ApiOperation({ summary: 'List approved product reviews' })
	@ApiParam({ name: 'id', format: 'uuid', description: 'Product ID' })
	@ApiPaginatedWrappedResponse(ReviewResponseDto, 'Paginated review response')
	@ApiStandardErrors()
	listProduct(@Param() params: IdParamDto, @Query() query: PaginationQueryDto) {
		return this.reviewsService.listProduct(params.id, query.page, query.limit);
	}

	@Post('products/:id/reviews')
	@ApiBearerAuth('bearer')
	@ResponseMessage('Review created successfully')
	@ApiOperation({ summary: 'Create a product review' })
	@ApiParam({ name: 'id', format: 'uuid', description: 'Product ID' })
	@ApiBody({ type: CreateReviewDto })
	@ApiWrappedResponse(ReviewResponseDto, 'Created review response')
	@ApiStandardErrors()
	create(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto, @Body() dto: CreateReviewDto) {
		return this.reviewsService.create(user.id, params.id, dto);
	}

	@Patch('reviews/:id')
	@ApiBearerAuth('bearer')
	@ResponseMessage('Review updated successfully')
	@ApiOperation({ summary: 'Update current user review' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateReviewDto })
	@ApiWrappedResponse(ReviewResponseDto, 'Updated review response')
	@ApiStandardErrors()
	update(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto, @Body() dto: UpdateReviewDto) {
		return this.reviewsService.update(user.id, params.id, dto);
	}

	@Delete('reviews/:id')
	@ApiBearerAuth('bearer')
	@ResponseMessage('Review deleted successfully')
	@ApiOperation({ summary: 'Delete current user review' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(Object, 'Deleted review response')
	@ApiStandardErrors()
	deleteOwn(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.reviewsService.deleteOwn(user.id, params.id);
	}
}
