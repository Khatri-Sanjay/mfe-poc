import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { InventoryAdjustmentDto } from '../dto/inventory-adjustment.dto';
import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { InventoryService } from '../services/inventory.service';

@ApiTags('Admin Inventory')
@ApiBearerAuth('bearer')
@RequirePermissions('inventory.read')
@Controller('admin/inventory')
export class AdminInventoryController {
	constructor(private readonly inventoryService: InventoryService) {}

	@Get()
	@ResponseMessage('Inventory retrieved successfully')
	@ApiOperation({
		summary: 'List inventory',
		description: 'Requires `inventory.read`.'
	})
	@ApiPaginatedWrappedResponse(InventoryResponseDto, 'Paginated inventory response')
	@ApiStandardErrors()
	list(@Query() query: PaginationQueryDto) {
		return this.inventoryService.list(query);
	}

	@Get(':variantId')
	@ResponseMessage('Inventory item retrieved successfully')
	@ApiOperation({
		summary: 'Get inventory by variant id',
		description: 'Requires `inventory.read`.'
	})
	@ApiParam({ name: 'variantId', format: 'uuid' })
	@ApiWrappedResponse(InventoryResponseDto, 'Inventory detail response')
	@ApiStandardErrors()
	get(@Param('variantId') variantId: string) {
		return this.inventoryService.getByVariantId(variantId);
	}

	@Post(':variantId/adjustments')
	@RequirePermissions('inventory.manage')
	@ResponseMessage('Inventory adjusted successfully')
	@ApiOperation({
		summary: 'Adjust inventory',
		description: 'Requires `inventory.manage`.'
	})
	@ApiParam({ name: 'variantId', format: 'uuid' })
	@ApiBody({ type: InventoryAdjustmentDto })
	@ApiWrappedResponse(InventoryResponseDto, 'Adjusted inventory response')
	@ApiStandardErrors()
	adjust(@Param('variantId') variantId: string, @Body() dto: InventoryAdjustmentDto, @CurrentUser() user: AuthenticatedUser) {
		return this.inventoryService.adjust(variantId, dto, user.id);
	}
}
