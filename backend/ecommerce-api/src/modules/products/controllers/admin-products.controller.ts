import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';
import { RequirePermissions } from '../../../common/decorators/require-permissions.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiPaginatedWrappedResponse, ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { CreateProductDto, CreateProductImageDto, CreateProductVariantDto } from '../dto/create-product.dto';
import { ProductQueryDto } from '../dto/product-query.dto';
import { ProductResponseDto } from '../dto/product-response.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { UpdateProductImageDto } from '../dto/update-product-image.dto';
import { ProductsService } from '../services/products.service';

class ProductImageParamDto extends IdParamDto {
	@IsUUID()
	imageId!: string;
}

class ProductVariantParamDto extends IdParamDto {
	@IsUUID()
	variantId!: string;
}

@ApiTags('Admin Products')
@ApiBearerAuth('bearer')
@Controller('admin/products')
export class AdminProductsController {
	constructor(private readonly productsService: ProductsService) {}

	@Get()
	@RequirePermissions('product.read')
	@ResponseMessage('Products retrieved successfully')
	@ApiOperation({
		summary: 'List admin products',
		description: 'Requires `product.read`.'
	})
	@ApiPaginatedWrappedResponse(ProductResponseDto, 'Paginated admin product response')
	@ApiStandardErrors()
	list(@Query() query: ProductQueryDto) {
		return this.productsService.listAdmin(query);
	}

	@Get(':id')
	@RequirePermissions('product.read')
	@ResponseMessage('Product retrieved successfully')
	@ApiOperation({
		summary: 'Get admin product by id',
		description: 'Requires `product.read`.'
	})
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(ProductResponseDto, 'Admin product detail response')
	@ApiStandardErrors()
	get(@Param() params: IdParamDto) {
		return this.productsService.getAdminById(params.id);
	}

	@Post()
	@RequirePermissions('product.create')
	@ResponseMessage('Product created successfully')
	@ApiOperation({
		summary: 'Create product',
		description: 'Requires `product.create`.'
	})
	@ApiBody({ type: CreateProductDto })
	@ApiWrappedResponse(ProductResponseDto, 'Created product response')
	@ApiStandardErrors()
	create(@Body() dto: CreateProductDto) {
		return this.productsService.create(dto);
	}

	@Patch(':id')
	@RequirePermissions('product.update')
	@ResponseMessage('Product updated successfully')
	@ApiOperation({
		summary: 'Update product',
		description: 'Requires `product.update`.'
	})
	@ApiBody({ type: UpdateProductDto })
	@ApiWrappedResponse(ProductResponseDto, 'Updated product response')
	@ApiStandardErrors()
	update(@Param() params: IdParamDto, @Body() dto: UpdateProductDto) {
		return this.productsService.update(params.id, dto);
	}

	@Delete(':id')
	@RequirePermissions('product.delete')
	@ResponseMessage('Product deleted successfully')
	@ApiOperation({
		summary: 'Delete product',
		description: 'Requires `product.delete`.'
	})
	@ApiWrappedResponse(Object, 'Deleted product response')
	@ApiStandardErrors()
	delete(@Param() params: IdParamDto) {
		return this.productsService.delete(params.id);
	}

	@Post(':id/images')
	@RequirePermissions('product.update')
	@ResponseMessage('Product image added successfully')
	@ApiBody({ type: CreateProductImageDto })
	@ApiWrappedResponse(Object, 'Created product image response')
	@ApiStandardErrors()
	addImage(@Param() params: IdParamDto, @Body() dto: CreateProductImageDto) {
		return this.productsService.addImage(params.id, dto);
	}

	@Delete(':id/images/:imageId')
	@RequirePermissions('product.update')
	@ResponseMessage('Product image deleted successfully')
	@ApiWrappedResponse(Object, 'Deleted product image response')
	@ApiStandardErrors()
	deleteImage(@Param() params: ProductImageParamDto) {
		return this.productsService.deleteImage(params.id, params.imageId);
	}

	@Patch(':id/images/:imageId')
	@RequirePermissions('product.update')
	@ResponseMessage('Product image updated successfully')
	@ApiBody({ type: UpdateProductImageDto })
	@ApiWrappedResponse(Object, 'Updated product image response')
	@ApiStandardErrors()
	updateImage(@Param() params: ProductImageParamDto, @Body() dto: UpdateProductImageDto) {
		return this.productsService.updateImage(params.id, params.imageId, dto);
	}

	@Post(':id/variants')
	@RequirePermissions('product.update')
	@ResponseMessage('Product variant added successfully')
	@ApiBody({ type: CreateProductVariantDto })
	@ApiWrappedResponse(Object, 'Created product variant response')
	@ApiStandardErrors()
	addVariant(@Param() params: IdParamDto, @Body() dto: CreateProductVariantDto) {
		return this.productsService.addVariant(params.id, dto);
	}

	@Patch(':id/variants/:variantId')
	@RequirePermissions('product.update')
	@ResponseMessage('Product variant updated successfully')
	@ApiBody({ type: CreateProductVariantDto })
	@ApiWrappedResponse(Object, 'Updated product variant response')
	@ApiStandardErrors()
	updateVariant(@Param() params: ProductVariantParamDto, @Body() dto: Partial<CreateProductVariantDto>) {
		return this.productsService.updateVariant(params.id, params.variantId, dto);
	}

	@Delete(':id/variants/:variantId')
	@RequirePermissions('product.update')
	@ResponseMessage('Product variant deleted successfully')
	@ApiWrappedResponse(Object, 'Deleted product variant response')
	@ApiStandardErrors()
	deleteVariant(@Param() params: ProductVariantParamDto) {
		return this.productsService.deleteVariant(params.id, params.variantId);
	}
}
