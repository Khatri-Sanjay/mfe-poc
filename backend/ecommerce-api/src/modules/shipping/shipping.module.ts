import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminShippingMethodsController } from './controllers/admin-shipping-methods.controller';
import { ShippingMethodsController } from './controllers/shipping-methods.controller';
import { ShippingMethod } from './entities/shipping-method.entity';
import { ShippingMethodsService } from './services/shipping-methods.service';

@Module({
	imports: [TypeOrmModule.forFeature([ShippingMethod])],
	controllers: [ShippingMethodsController, AdminShippingMethodsController],
	providers: [ShippingMethodsService],
	exports: [ShippingMethodsService, TypeOrmModule]
})
export class ShippingModule {}
