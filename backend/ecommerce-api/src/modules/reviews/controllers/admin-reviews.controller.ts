import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { AdminReviewQueryDto, ReviewResponseDto, UpdateReviewStatusDto } from '../dto/review.dto';
import { ReviewsService } from '../services/reviews.service';

@ApiTags('Admin Reviews')
@ApiBearerAuth('bearer')
@RequirePermissions('review.manage')
@Controller('admin/reviews')
export class AdminReviewsController {
	constructor(private readonly reviewsService: ReviewsService) {}

	@Get()
	@ResponseMessage('Reviews retrieved successfully')
	@ApiOperation({ summary: 'List reviews for moderation' })
	@ApiPaginatedWrappedResponse(ReviewResponseDto, 'Paginated review response')
	@ApiStandardErrors()
	list(@Query() query: AdminReviewQueryDto) {
		return this.reviewsService.listAdmin(query);
	}

	@Patch(':id/status')
	@ResponseMessage('Review status updated successfully')
	@ApiOperation({ summary: 'Moderate review status' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateReviewStatusDto })
	@ApiWrappedResponse(ReviewResponseDto, 'Updated review response')
	@ApiStandardErrors()
	updateStatus(@Param() params: IdParamDto, @Body() dto: UpdateReviewStatusDto) {
		return this.reviewsService.updateStatus(params.id, dto);
	}

	@Delete(':id')
	@ResponseMessage('Review deleted successfully')
	@ApiOperation({ summary: 'Delete review as moderator' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(Object, 'Deleted review response')
	@ApiStandardErrors()
	delete(@Param() params: IdParamDto) {
		return this.reviewsService.deleteAdmin(params.id);
	}
}
