import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { AddWishlistItemDto, WishlistResponseDto } from '../dto/wishlist.dto';
import { WishlistsService } from '../services/wishlists.service';

@ApiTags('Wishlist')
@ApiBearerAuth('bearer')
@Controller('wishlist')
export class WishlistController {
	constructor(private readonly wishlistsService: WishlistsService) {}

	@Get()
	@ResponseMessage('Wishlist retrieved successfully')
	@ApiOperation({ summary: 'Get current user wishlist' })
	@ApiWrappedResponse(WishlistResponseDto, 'Wishlist response')
	@ApiStandardErrors()
	list(@CurrentUser() user: AuthenticatedUser) {
		return this.wishlistsService.list(user.id);
	}

	@Post('items')
	@ResponseMessage('Wishlist item added successfully')
	@ApiOperation({ summary: 'Add product to wishlist' })
	@ApiBody({ type: AddWishlistItemDto })
	@ApiWrappedResponse(WishlistResponseDto, 'Updated wishlist response')
	@ApiStandardErrors()
	add(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddWishlistItemDto) {
		return this.wishlistsService.add(user.id, dto);
	}

	@Delete('items/:id')
	@ResponseMessage('Wishlist item removed successfully')
	@ApiOperation({ summary: 'Remove product from wishlist' })
	@ApiParam({ name: 'id', format: 'uuid', description: 'Product ID' })
	@ApiWrappedResponse(WishlistResponseDto, 'Updated wishlist response')
	@ApiStandardErrors()
	remove(@CurrentUser() user: AuthenticatedUser, @Param() params: IdParamDto) {
		return this.wishlistsService.remove(user.id, params.id);
	}

	@Delete()
	@ResponseMessage('Wishlist cleared successfully')
	@ApiOperation({ summary: 'Clear current user wishlist' })
	@ApiWrappedResponse(Object, 'Cleared wishlist response')
	@ApiStandardErrors()
	clear(@CurrentUser() user: AuthenticatedUser) {
		return this.wishlistsService.clear(user.id);
	}
}
