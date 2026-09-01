import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminCouponsController } from './controllers/admin-coupons.controller';
import { Coupon } from './entities/coupon.entity';
import { CouponsService } from './services/coupons.service';

@Module({
	imports: [TypeOrmModule.forFeature([Coupon])],
	controllers: [AdminCouponsController],
	providers: [CouponsService],
	exports: [CouponsService, TypeOrmModule]
})
export class DiscountsModule {}
