import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../../common/decorators/public.decorator';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { ShippingMethodResponseDto } from '../dto/shipping-method.dto';
import { ShippingMethodsService } from '../services/shipping-methods.service';

@ApiTags('Shipping')
@Controller('shipping/methods')
export class ShippingMethodsController {
	constructor(private readonly service: ShippingMethodsService) {}

	@Get()
	@Public()
	@ResponseMessage('Shipping methods retrieved successfully')
	@ApiOperation({ summary: 'List active shipping methods' })
	@ApiWrappedResponse(ShippingMethodResponseDto, 'Shipping method list response')
	@ApiStandardErrors()
	listPublic() {
		return this.service.listPublic();
	}
}
