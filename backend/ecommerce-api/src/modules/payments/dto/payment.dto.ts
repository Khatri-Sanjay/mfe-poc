import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '../enums/payment-status.enum';

export class PaymentResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty()
	orderId!: string;
	@ApiProperty()
	provider!: string;
	@ApiProperty()
	providerPaymentId!: string;
	@ApiProperty()
	amount!: string;
	@ApiProperty()
	currency!: string;
	@ApiProperty({ enum: PaymentStatus })
	status!: PaymentStatus;
	@ApiProperty({ nullable: true })
	failureCode!: string | null;
	@ApiProperty({ nullable: true })
	failureMessage!: string | null;
}
