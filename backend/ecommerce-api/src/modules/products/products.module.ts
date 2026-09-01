import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BrandsModule } from '../brands/brands.module';
import { CategoriesModule } from '../categories/categories.module';
import { InventoryItem } from '../inventory/entities/inventory-item.entity';
import { AdminProductsController } from './controllers/admin-products.controller';
import { ProductsController } from './controllers/products.controller';
import { ProductImage } from './entities/product-image.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from './entities/product.entity';
import { ProductsService } from './services/products.service';

@Module({
	imports: [TypeOrmModule.forFeature([Product, ProductImage, ProductVariant, InventoryItem]), BrandsModule, CategoriesModule],
	controllers: [ProductsController, AdminProductsController],
	providers: [ProductsService],
	exports: [ProductsService, TypeOrmModule]
})
export class ProductsModule {}
