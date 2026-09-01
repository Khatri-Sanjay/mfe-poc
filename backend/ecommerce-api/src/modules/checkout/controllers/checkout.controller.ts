import { Body, Controller, Headers, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import type { AuthenticatedUser } from '../../auth/interfaces/authenticated-user.interface';
import { CheckoutDto, CheckoutQuoteDto } from '../dto/checkout.dto';
import { CheckoutService } from '../services/checkout.service';

@ApiTags('Checkout')
@ApiBearerAuth('bearer')
@Controller('checkout')
export class CheckoutController {
	constructor(private readonly checkoutService: CheckoutService) {}

	@Post('quote')
	@ResponseMessage('Checkout quote generated successfully')
	@ApiOperation({ summary: 'Generate checkout quote from current cart' })
	@ApiBody({ type: CheckoutQuoteDto })
	@ApiWrappedResponse(Object, 'Checkout quote response')
	@ApiStandardErrors()
	quote(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutQuoteDto) {
		return this.checkoutService.quote(user.id, dto);
	}

	@Post()
	@ResponseMessage('Checkout completed successfully')
	@ApiOperation({ summary: 'Checkout current cart and create an order' })
	@ApiHeader({ name: 'Idempotency-Key', required: false })
	@ApiBody({ type: CheckoutDto })
	@ApiWrappedResponse(Object, 'Checkout response')
	@ApiStandardErrors()
	checkout(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto, @Headers('Idempotency-Key') idempotencyKey?: string) {
		return this.checkoutService.checkout(user.id, dto, idempotencyKey);
	}
}
