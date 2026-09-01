import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesModule } from '../addresses/addresses.module';
import { CartsModule } from '../carts/carts.module';
import { DiscountsModule } from '../discounts/discounts.module';
import { IdempotencyModule } from '../idempotency/idempotency.module';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { OrderAddress } from '../orders/entities/order-address.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { OrderStatusHistory } from '../orders/entities/order-status-history.entity';
import { Order } from '../orders/entities/order.entity';
import { PaymentsModule } from '../payments/payments.module';
import { ShippingModule } from '../shipping/shipping.module';
import { CheckoutController } from './controllers/checkout.controller';
import { CheckoutService } from './services/checkout.service';

@Module({
	imports: [
		TypeOrmModule.forFeature([InventoryItem, Order, OrderItem, OrderAddress, OrderStatusHistory]),
		AddressesModule,
		CartsModule,
		DiscountsModule,
		ShippingModule,
		PaymentsModule,
		IdempotencyModule
	],
	controllers: [CheckoutController],
	providers: [CheckoutService]
})
export class CheckoutModule {}
