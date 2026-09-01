import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payment } from '../payments/entities/payment.entity';
import { PaymentsModule } from '../payments/payments.module';
import { Refund } from './entities/refund.entity';
import { RefundsService } from './services/refunds.service';

@Module({
	imports: [TypeOrmModule.forFeature([Refund, Payment, Order]), PaymentsModule],
	providers: [RefundsService],
	exports: [RefundsService, TypeOrmModule]
})
export class RefundsModule {}
