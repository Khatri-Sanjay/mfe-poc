import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiCreatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { CreateShippingMethodDto, ShippingMethodResponseDto, UpdateShippingMethodDto } from '../dto/shipping-method.dto';
import { ShippingMethodsService } from '../services/shipping-methods.service';

@ApiTags('Admin Shipping')
@ApiBearerAuth('bearer')
@RequirePermissions('order.manage')
@Controller('admin/shipping/methods')
export class AdminShippingMethodsController {
	constructor(private readonly service: ShippingMethodsService) {}

	@Get()
	@ResponseMessage('Shipping methods retrieved successfully')
	@ApiOperation({ summary: 'List shipping methods for administration' })
	@ApiWrappedResponse(ShippingMethodResponseDto, 'Shipping method list response')
	@ApiStandardErrors()
	listAdmin() {
		return this.service.listAdmin();
	}

	@Post()
	@ResponseMessage('Shipping method created successfully')
	@ApiOperation({ summary: 'Create a shipping method' })
	@ApiBody({ type: CreateShippingMethodDto })
	@ApiCreatedWrappedResponse(ShippingMethodResponseDto, 'Created shipping method response')
	@ApiStandardErrors()
	create(@Body() dto: CreateShippingMethodDto) {
		return this.service.create(dto);
	}

	@Patch(':id')
	@ResponseMessage('Shipping method updated successfully')
	@ApiOperation({ summary: 'Update a shipping method' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateShippingMethodDto })
	@ApiWrappedResponse(ShippingMethodResponseDto, 'Updated shipping method response')
	@ApiStandardErrors()
	update(@Param() params: IdParamDto, @Body() dto: UpdateShippingMethodDto) {
		return this.service.update(params.id, dto);
	}

	@Delete(':id')
	@ResponseMessage('Shipping method deleted successfully')
	@ApiOperation({ summary: 'Delete a shipping method' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(Object, 'Deleted shipping method response')
	@ApiStandardErrors()
	delete(@Param() params: IdParamDto) {
		return this.service.delete(params.id);
	}
}
