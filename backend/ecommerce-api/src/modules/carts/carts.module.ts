import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DiscountsModule } from '../discounts/discounts.module';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { ProductVariant } from '../products/entities/product-variant.entity';
import { CartController } from './controllers/cart.controller';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from './entities/cart.entity';
import { CartsService } from './services/carts.service';

@Module({
	imports: [TypeOrmModule.forFeature([Cart, CartItem, ProductVariant, InventoryItem]), DiscountsModule],
	controllers: [CartController],
	providers: [CartsService],
	exports: [CartsService, TypeOrmModule]
})
export class CartsModule {}
