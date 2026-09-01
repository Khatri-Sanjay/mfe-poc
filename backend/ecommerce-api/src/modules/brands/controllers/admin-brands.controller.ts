import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { BrandsService } from '../services/brands.service';

@ApiTags('Admin Brands')
@ApiBearerAuth('bearer')
@RequirePermissions('brand.manage')
@Controller('admin/brands')
export class AdminBrandsController {
	constructor(private readonly brandsService: BrandsService) {}

	@Post()
	@ResponseMessage('Brand created successfully')
	@ApiOperation({
		summary: 'Create brand',
		description: 'Requires `brand.manage`.'
	})
	@ApiBody({ type: CreateBrandDto })
	@ApiWrappedResponse(BrandResponseDto, 'Created brand response')
	@ApiStandardErrors()
	create(@Body() dto: CreateBrandDto) {
		return this.brandsService.create(dto);
	}

	@Patch(':id')
	@ResponseMessage('Brand updated successfully')
	@ApiOperation({
		summary: 'Update brand',
		description: 'Requires `brand.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateBrandDto })
	@ApiWrappedResponse(BrandResponseDto, 'Updated brand response')
	@ApiStandardErrors()
	update(@Param() params: IdParamDto, @Body() dto: UpdateBrandDto) {
		return this.brandsService.update(params.id, dto);
	}

	@Delete(':id')
	@ResponseMessage('Brand deleted successfully')
	@ApiOperation({
		summary: 'Delete brand',
		description: 'Requires `brand.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(Object, 'Deleted brand response')
	@ApiStandardErrors()
	delete(@Param() params: IdParamDto) {
		return this.brandsService.delete(params.id);
	}
}
