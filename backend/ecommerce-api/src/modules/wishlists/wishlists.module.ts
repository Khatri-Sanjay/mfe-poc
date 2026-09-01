import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { WishlistController } from './controllers/wishlist.controller';
import { WishlistItem } from './entities/wishlist-item.entity';
import { WishlistsService } from './services/wishlists.service';

@Module({
	imports: [TypeOrmModule.forFeature([WishlistItem, Product])],
	controllers: [WishlistController],
	providers: [WishlistsService]
})
export class WishlistsModule {}
