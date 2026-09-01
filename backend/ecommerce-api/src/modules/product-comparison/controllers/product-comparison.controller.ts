import { Controller, Get, Param } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { ProductComparisonResponseDto } from '../dto/product-comparison-response.dto';
import { ProductComparisonService } from '../services/product-comparison.service';

class ProductComparisonParamDto {
	@IsUUID()
	productId!: string;
}

@ApiTags('Product Comparison')
@Public()
@Controller('product-comparison')
export class ProductComparisonController {
	constructor(private readonly productComparisonService: ProductComparisonService) {}

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
