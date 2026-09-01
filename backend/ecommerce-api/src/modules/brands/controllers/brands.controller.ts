import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { BrandResponseDto } from '../dto/brand-response.dto';
import { BrandsService } from '../services/brands.service';

@ApiTags('Brands')
@Public()
@Controller('brands')
export class BrandsController {
	constructor(private readonly brandsService: BrandsService) {}

	@Get()
	@ResponseMessage('Brands retrieved successfully')
	@ApiOperation({ summary: 'List active brands' })
	@ApiWrappedResponse(BrandResponseDto, 'Brand list response')
	@ApiStandardErrors()
	list() {
		return this.brandsService.listPublic();
	}

	@Get(':slug')
	@ResponseMessage('Brand retrieved successfully')
	@ApiOperation({ summary: 'Get brand by slug' })
	@ApiParam({ name: 'slug', example: 'apple' })
	@ApiWrappedResponse(BrandResponseDto, 'Brand detail response')
	@ApiStandardErrors()
	getBySlug(@Param('slug') slug: string) {
		return this.brandsService.getBySlug(slug);
	}
}
