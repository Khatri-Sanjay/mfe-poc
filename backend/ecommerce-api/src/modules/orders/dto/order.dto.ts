import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { OrderStatus } from '../enums/order-status.enum';

export class OrderResponseDto {
	@ApiProperty()
	id!: string;
	@ApiProperty({ enum: OrderStatus })
	status!: OrderStatus;
	@ApiProperty()
	subtotal!: string;
	@ApiProperty()
	discountTotal!: string;
	@ApiProperty()
	shippingTotal!: string;
	@ApiProperty()
	taxTotal!: string;
	@ApiProperty()
	grandTotal!: string;
	@ApiProperty()
	currency!: string;
	@ApiProperty({ type: 'array' })
	items!: unknown[];
}

export class AdminOrderQueryDto extends PaginationQueryDto {
	@ApiPropertyOptional({ enum: OrderStatus })
	@IsEnum(OrderStatus)
	@IsOptional()
	status?: OrderStatus;
}

export class UpdateOrderStatusDto {
	@ApiProperty({ enum: OrderStatus })
	@IsEnum(OrderStatus)
	status!: OrderStatus;

	@ApiPropertyOptional()
	@IsString()
	@MaxLength(500)
	@IsOptional()
	note?: string;
}

export class CreateRefundDto {
	@ApiProperty({ example: '10.00' })
	@Matches(/^\d{1,10}(\.\d{1,2})?$/)
	amount!: string;

	@ApiProperty()
	@IsString()
	@MaxLength(500)
	reason!: string;
}
