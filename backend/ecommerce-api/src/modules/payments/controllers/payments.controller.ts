import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ResponseMessage } from '../../../common/decorators/response-message.decorator';
import { IdParamDto } from '../../../common/dto/id-param.dto';
import { ApiStandardErrors, ApiWrappedResponse } from '../../../common/utils/swagger-response.util';
import { PaymentResponseDto } from '../dto/payment.dto';
import { PaymentsService } from '../services/payments.service';

@ApiTags('Payments')
@ApiBearerAuth('bearer')
@Controller('payments')
export class PaymentsController {
	constructor(private readonly paymentsService: PaymentsService) {}

	@Get(':id')
	@ResponseMessage('Payment retrieved successfully')
	@ApiOperation({ summary: 'Get payment details' })
	@ApiParam({ name: 'id', format: 'uuid' })
	@ApiWrappedResponse(PaymentResponseDto, 'Payment response')
	@ApiStandardErrors()
	get(@Param() params: IdParamDto) {
		return this.paymentsService.get(params.id);
	}
}
