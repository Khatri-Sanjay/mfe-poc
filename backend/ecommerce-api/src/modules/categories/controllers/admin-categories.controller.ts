import { Body, Controller, Delete, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CreateCategoryDto } from '../dto/create-category.dto';
import { UpdateCategoryDto } from '../dto/update-category.dto';
import { CategoriesService } from '../services/categories.service';

@ApiTags('Admin Categories')
@ApiBearerAuth('bearer')
@RequirePermissions('category.manage')
@Controller('admin/categories')
export class AdminCategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Post()
	@ResponseMessage('Category created successfully')
	@ApiOperation({
		summary: 'Create category',
		description: 'Requires `category.manage`.'
	})
	@ApiBody({ type: CreateCategoryDto })
	@ApiWrappedResponse(CategoryResponseDto, 'Created category response')
	@ApiStandardErrors()
	create(@Body() dto: CreateCategoryDto) {
		return this.categoriesService.create(dto);
	}

	@Patch(':id')
	@ResponseMessage('Category updated successfully')
	@ApiOperation({
		summary: 'Update category',
		description: 'Requires `category.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateCategoryDto })
	@ApiWrappedResponse(CategoryResponseDto, 'Updated category response')
	@ApiStandardErrors()
	update(@Param() params: IdParamDto, @Body() dto: UpdateCategoryDto) {
		return this.categoriesService.update(params.id, dto);
	}

	@Delete(':id')
	@ResponseMessage('Category deleted successfully')
	@ApiOperation({
		summary: 'Delete category',
		description: 'Requires `category.manage`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(Object, 'Deleted category response')
	@ApiStandardErrors()
	delete(@Param() params: IdParamDto) {
		return this.categoriesService.delete(params.id);
	}
}
