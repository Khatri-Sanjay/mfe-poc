import { Module } from '@nestjs/common';
import { ProductsModule } from '../products/products.module';
import { ProductComparisonController } from './controllers/product-comparison.controller';
import { PRODUCT_SOURCES } from './interfaces/product-source.interface';
import { ProductComparisonService } from './services/product-comparison.service';
import { ProductMatchingService } from './services/product-matching.service';
import { MockDataFeedSource } from './sources/mock-data-feed.source';
import { MockMarketplaceSource } from './sources/mock-marketplace.source';
import { MockRetailerSource } from './sources/mock-retailer.source';

@Module({
	imports: [ProductsModule],
	controllers: [ProductComparisonController],
	providers: [
		ProductComparisonService,
		ProductMatchingService,
		MockMarketplaceSource,
		MockRetailerSource,
		MockDataFeedSource,
		{
			provide: PRODUCT_SOURCES,
			useFactory: (
				mockMarketplaceSource: MockMarketplaceSource,
				mockRetailerSource: MockRetailerSource,
				mockDataFeedSource: MockDataFeedSource
			) => [mockMarketplaceSource, mockRetailerSource, mockDataFeedSource],
			inject: [MockMarketplaceSource, MockRetailerSource, MockDataFeedSource]
		}
	]
})
export class ProductComparisonModule {}
