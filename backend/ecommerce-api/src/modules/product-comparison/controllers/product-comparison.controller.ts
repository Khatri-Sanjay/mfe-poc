import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { ProductComparisonResponseDto } from '../dto/product-comparison-response.dto';
import { ProductComparisonService } from '../services/product-comparison.service';

class ProductComparisonParamDto {
	@IsUUID()
	productId!: string;
}

class ProductComparisonSearchQueryDto {
	@IsString()
	@MinLength(2)
	@MaxLength(120)
	query!: string;
}

@ApiTags('Product Comparison')
@Public()
@Controller('product-comparison')
export class ProductComparisonController {
	constructor(private readonly productComparisonService: ProductComparisonService) {}

	@Get('search/items')
	@ResponseMessage('Product search comparison retrieved successfully')
	@ApiOperation({
		summary: 'Search external commerce sources by product name and compare normalized offers',
		description:
			'Uses source adapters that can be backed by authorized APIs, feeds, or scraping providers. Local adapters return deterministic marketplace data.'
	})
	@ApiQuery({ name: 'query', minLength: 2, maxLength: 120 })
	@ApiWrappedResponse(ProductComparisonResponseDto, 'Product search comparison response')
	@ApiStandardErrors()
	search(@Query() query: ProductComparisonSearchQueryDto) {
		return this.productComparisonService.search(query.query);
	}

	@Get(':productId')
	@ResponseMessage('Product comparison retrieved successfully')
	@ApiOperation({
		summary: 'Compare a product price against normalized external product sources',
		description: 'Uses mock source adapters today. Replace the adapters with authorized APIs, feeds, or search providers later.'
	})
	@ApiParam({ name: 'productId', format: 'uuid' })
	@ApiWrappedResponse(ProductComparisonResponseDto, 'Product comparison response')
	@ApiStandardErrors()
	compare(@Param() params: ProductComparisonParamDto) {
		return this.productComparisonService.compare(params.productId);
	}
}
