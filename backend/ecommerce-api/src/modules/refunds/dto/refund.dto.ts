import { ApiProperty } from '@nestjs/swagger';
import { RefundStatus } from '../enums/refund-status.enum';

export class RefundResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty()
	paymentId!: string;
	@ApiProperty()
	orderId!: string;
	@ApiProperty()
	amount!: string;
	@ApiProperty()
	reason!: string;
	@ApiProperty()
	providerRefundId!: string;
	@ApiProperty({ enum: RefundStatus })
	status!: RefundStatus;
	@ApiProperty({ nullable: true })
	createdBy!: string | null;
}
