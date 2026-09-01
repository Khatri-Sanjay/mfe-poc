import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { CategoryResponseDto } from '../dto/category-response.dto';
import { CategoriesService } from '../services/categories.service';

@ApiTags('Categories')
@Public()
@Controller('categories')
export class CategoriesController {
	constructor(private readonly categoriesService: CategoriesService) {}

	@Get()
	@ResponseMessage('Categories retrieved successfully')
	@ApiOperation({ summary: 'List active categories' })
	@ApiWrappedResponse(CategoryResponseDto, 'Category list response')
	@ApiStandardErrors()
	list() {
		return this.categoriesService.listPublic();
	}

	@Get(':slug')
	@ResponseMessage('Category retrieved successfully')
	@ApiOperation({ summary: 'Get category by slug' })
	@ApiParam({ name: 'slug', example: 'phones' })
	@ApiWrappedResponse(CategoryResponseDto, 'Category detail response')
	@ApiStandardErrors()
	getBySlug(@Param('slug') slug: string) {
		return this.categoriesService.getBySlug(slug);
	}
}
