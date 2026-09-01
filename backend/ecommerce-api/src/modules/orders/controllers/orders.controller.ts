import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { OrderResponseDto } from '../dto/order.dto';
import { OrdersService } from '../services/orders.service';

@ApiTags('Orders')
@ApiBearerAuth('bearer')
@Controller('orders')
export class OrdersController {
	constructor(private readonly ordersService: OrdersService) {}

	@Get()
	@ResponseMessage('Orders retrieved successfully')
	@ApiOperation({ summary: 'List current user orders' })
	@ApiQuery({ name: 'page', required: false, example: 1 })
	@ApiQuery({ name: 'limit', required: false, example: 20 })
	@ApiPaginatedWrappedResponse(OrderResponseDto, 'Paginated order response')
	@ApiStandardErrors()
	list(@CurrentUser() user: AuthenticatedUser, @Query() query: PaginationQueryDto) {
		return this.ordersService.listCustomer(user.id, query.page, query.limit);
	}

	@Get(':id')
	@ResponseMessage('Order retrieved successfully')
	@ApiOperation({ summary: 'Get current user order' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(OrderResponseDto, 'Order response')
	@ApiStandardErrors()
	get(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.ordersService.getCustomer(user.id, params.id);
	}

	@Post(':id/cancel')
	@ResponseMessage('Order cancelled successfully')
	@ApiOperation({ summary: 'Cancel current user order' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(OrderResponseDto, 'Cancelled order response')
	@ApiStandardErrors()
	cancel(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.ordersService.cancelCustomer(user.id, params.id);
	}
}
