import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefundsModule } from '../refunds/refunds.module';
import { AdminOrdersController } from './controllers/admin-orders.controller';
import { OrdersController } from './controllers/orders.controller';
import { OrderAddress } from './entities/order-address.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory } from './entities/order-status-history.entity';
import { Order } from './entities/order.entity';
import { OrdersService } from './services/orders.service';

@Module({
	imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderAddress, OrderStatusHistory]), forwardRef(() => RefundsModule)],
	controllers: [OrdersController, AdminOrdersController],
	providers: [OrdersService],
	exports: [OrdersService, TypeOrmModule]
})
export class OrdersModule {}
