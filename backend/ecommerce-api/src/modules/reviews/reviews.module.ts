import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { Product } from '../products/entities/product.entity';
import { AdminReviewsController } from './controllers/admin-reviews.controller';
import { ReviewsController } from './controllers/reviews.controller';
import { Review } from './entities/review.entity';
import { ReviewsService } from './services/reviews.service';

@Module({
	imports: [TypeOrmModule.forFeature([Review, Product, Order])],
	controllers: [ReviewsController, AdminReviewsController],
	providers: [ReviewsService]
})
export class ReviewsModule {}
