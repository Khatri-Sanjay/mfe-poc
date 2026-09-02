import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ProductComparisonController } from './controllers/product-comparison.controller';
import { PRODUCT_SOURCES } from './interfaces/product-source.interface';
import { ProductComparisonService } from './services/product-comparison.service';
import { ProductMatchingService } from './services/product-matching.service';
import { MarketplaceSearchSource } from './sources/marketplace-search.source';

@Module({
	imports: [ProductsModule],
	controllers: [ProductComparisonController],
	providers: [
		ProductComparisonService,
		ProductMatchingService,
		MarketplaceSearchSource,
		{
			provide: PRODUCT_SOURCES,
			useFactory: (marketplaceSearchSource: MarketplaceSearchSource) => [marketplaceSearchSource],
			inject: [MarketplaceSearchSource]
		}
	]
})
export class ProductComparisonModule {}
