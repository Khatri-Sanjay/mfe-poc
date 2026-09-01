import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { RefundResponseDto } from '../../refunds/dto/refund.dto';
import { RefundsService } from '../../refunds/services/refunds.service';
import { AdminOrderQueryDto, CreateRefundDto, OrderResponseDto, UpdateOrderStatusDto } from '../dto/order.dto';
import { OrdersService } from '../services/orders.service';

@ApiTags('Admin Orders')
@ApiBearerAuth('bearer')
@RequirePermissions('order.read')
@Controller('admin/orders')
export class AdminOrdersController {
	constructor(
		private readonly ordersService: OrdersService,
		private readonly refundsService: RefundsService
	) {}

	@Get()
	@ResponseMessage('Orders retrieved successfully')
	@ApiOperation({ summary: 'List orders for administration' })
	@ApiPaginatedWrappedResponse(OrderResponseDto, 'Paginated order response')
	@ApiStandardErrors()
	list(@Query() query: AdminOrderQueryDto) {
		return this.ordersService.listAdmin(query);
	}

	@Get(':id')
	@ResponseMessage('Order retrieved successfully')
	@ApiOperation({ summary: 'Get order for administration' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(OrderResponseDto, 'Order response')
	@ApiStandardErrors()
	get(@Param() params: IdParamDto) {
		return this.ordersService.getAdmin(params.id);
	}

	@Patch(':id/status')
	@RequirePermissions('order.manage')
	@ResponseMessage('Order status updated successfully')
	@ApiOperation({ summary: 'Update order status' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateOrderStatusDto })
	@ApiWrappedResponse(OrderResponseDto, 'Updated order response')
	@ApiStandardErrors()
	updateStatus(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto, @Body() dto: UpdateOrderStatusDto) {
		return this.ordersService.updateStatus(params.id, dto, user.id);
	}

	@Post(':id/refunds')
	@RequirePermissions('order.refund')
	@ResponseMessage('Refund created successfully')
	@ApiOperation({ summary: 'Create order refund' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: CreateRefundDto })
	@ApiWrappedResponse(RefundResponseDto, 'Refund response')
	@ApiStandardErrors()
	refund(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto, @Body() dto: CreateRefundDto) {
		return this.refundsService.create(params.id, dto, user.id);
	}
}
