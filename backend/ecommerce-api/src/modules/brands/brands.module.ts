import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminBrandsController } from './controllers/admin-brands.controller';
import { BrandsController } from './controllers/brands.controller';
import { Brand } from './entities/brand.entity';
import { BrandsService } from './services/brands.service';

@Module({
	imports: [TypeOrmModule.forFeature([Brand])],
	controllers: [BrandsController, AdminBrandsController],
	providers: [BrandsService],
	exports: [BrandsService, TypeOrmModule]
})
export class BrandsModule {}
