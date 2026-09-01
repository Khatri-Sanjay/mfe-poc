import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { ProductQueryDto } from '../dto/product-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { ProductsService } from '../services/products.service';

@ApiTags('Products')
@Public()
@Controller('products')
export class ProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get()
	@ResponseMessage('Products retrieved successfully')
	@ApiOperation({
		summary: 'List active products',
		description: 'Supports pagination, search, category, brand, price, stock, and safe sorting filters.'
	})
	@ApiPaginatedWrappedResponse(ProductResponseDto, 'Paginated product response')
	@ApiStandardErrors()
	list(@Query() query: ProductQueryDto) {
		return this.productsService.listPublic(query);
	}

	@Get(':id')
	@ResponseMessage('Product retrieved successfully')
	@ApiOperation({ summary: 'Get active product by id' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(ProductResponseDto, 'Product detail response')
	@ApiStandardErrors()
	getById(@Param() params: IdParamDto) {
		return this.productsService.getPublicById(params.id);
	}

	@Get('slug/:slug')
	@ResponseMessage('Product retrieved successfully')
	@ApiOperation({ summary: 'Get active product by slug' })
	@ApiParam({ name: 'slug' })
	@ApiWrappedResponse(ProductResponseDto, 'Product detail response')
	@ApiStandardErrors()
	getBySlug(@Param('slug') slug: string) {
		return this.productsService.getPublicBySlug(slug);
	}
}
