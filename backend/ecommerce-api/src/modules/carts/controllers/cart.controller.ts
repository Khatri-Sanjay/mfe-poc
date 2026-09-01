import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { ApplyCouponDto, CartItemRequestDto, CartResponseDto, UpdateCartItemDto } from '../dto/cart.dto';
import { CartsService } from '../services/carts.service';

@ApiTags('Cart')
@ApiBearerAuth('bearer')
@Controller('cart')
export class CartController {
	constructor(private readonly cartsService: CartsService) {}

	@Get()
	@ResponseMessage('Cart retrieved successfully')
	@ApiOperation({ summary: 'Get current user cart' })
	@ApiWrappedResponse(CartResponseDto, 'Cart response')
	@ApiStandardErrors()
	getCart(@CurrentUser() user: AuthenticatedUser) {
		return this.cartsService.getCart(user.id);
	}

	@Post('items')
	@ResponseMessage('Cart item added successfully')
	@ApiOperation({ summary: 'Add item to current user cart' })
	@ApiBody({ type: CartItemRequestDto })
	@ApiWrappedResponse(CartResponseDto, 'Updated cart response')
	@ApiStandardErrors()
	addItem(@CurrentUser() user: AuthenticatedUser, @Body() dto: CartItemRequestDto) {
		return this.cartsService.addItem(user.id, dto);
	}

	@Patch('items/:id')
	@ResponseMessage('Cart item updated successfully')
	@ApiOperation({ summary: 'Update cart item quantity' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiBody({ type: UpdateCartItemDto })
	@ApiWrappedResponse(CartResponseDto, 'Updated cart response')
	@ApiStandardErrors()
	updateItem(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto, @Body() dto: UpdateCartItemDto) {
		return this.cartsService.updateItem(user.id, params.id, dto);
	}

	@Delete('items/:id')
	@ResponseMessage('Cart item removed successfully')
	@ApiOperation({ summary: 'Remove cart item' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(CartResponseDto, 'Updated cart response')
	@ApiStandardErrors()
	removeItem(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.cartsService.removeItem(user.id, params.id);
	}

	@Delete()
	@ResponseMessage('Cart cleared successfully')
	@ApiOperation({ summary: 'Clear current user cart' })
	@ApiWrappedResponse(Object, 'Cleared cart response')
	@ApiStandardErrors()
	clear(@CurrentUser() user: AuthenticatedUser) {
		return this.cartsService.clear(user.id);
	}

	@Post('coupon')
	@ResponseMessage('Coupon applied successfully')
	@ApiOperation({ summary: 'Apply coupon to current user cart' })
	@ApiBody({ type: ApplyCouponDto })
	@ApiWrappedResponse(CartResponseDto, 'Updated cart response')
	@ApiStandardErrors()
	applyCoupon(@CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyCouponDto) {
		return this.cartsService.applyCoupon(user.id, dto);
	}

	@Delete('coupon')
	@ResponseMessage('Coupon removed successfully')
	@ApiOperation({ summary: 'Remove coupon from current user cart' })
	@ApiWrappedResponse(CartResponseDto, 'Updated cart response')
	@ApiStandardErrors()
	removeCoupon(@CurrentUser() user: AuthenticatedUser) {
		return this.cartsService.removeCoupon(user.id);
	}
}
