import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiCreatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { CouponResponseDto, CreateCouponDto, UpdateCouponDto } from '../dto/coupon.dto';
import { CouponsService } from '../services/coupons.service';

@ApiTags('Admin Coupons')
@ApiBearerAuth('bearer')
@RequirePermissions('discount.manage')
@Controller('admin/coupons')
export class AdminCouponsController {
	constructor(private readonly couponsService: CouponsService) {}

	@Get()
	@ResponseMessage('Coupons retrieved successfully')
	@ApiOperation({ summary: 'List coupons for administration' })
	@ApiWrappedResponse(CouponResponseDto, 'Coupon list response')
	@ApiStandardErrors()
	list() {
		return this.couponsService.list();
	}

	@Post()
	@ResponseMessage('Coupon created successfully')
	@ApiOperation({ summary: 'Create a coupon' })
	@ApiBody({ type: CreateCouponDto })
	@ApiCreatedWrappedResponse(CouponResponseDto, 'Created coupon response')
	@ApiStandardErrors()
	create(@Body() dto: CreateCouponDto) {
		return this.couponsService.create(dto);
	}

	@Patch(':id')
	@ResponseMessage('Coupon updated successfully')
	@ApiOperation({ summary: 'Update a coupon' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateCouponDto })
	@ApiWrappedResponse(CouponResponseDto, 'Updated coupon response')
	@ApiStandardErrors()
	update(@Param() params: IdParamDto, @Body() dto: UpdateCouponDto) {
		return this.couponsService.update(params.id, dto);
	}

	@Delete(':id')
	@ResponseMessage('Coupon deleted successfully')
	@ApiOperation({ summary: 'Delete a coupon' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(Object, 'Deleted coupon response')
	@ApiStandardErrors()
	delete(@Param() params: IdParamDto) {
		return this.couponsService.delete(params.id);
	}
}
