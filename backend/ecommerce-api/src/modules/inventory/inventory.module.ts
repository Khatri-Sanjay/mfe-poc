import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminInventoryController } from './controllers/admin-inventory.controller';
import { InventoryItem } from './entities/inventory-item.entity';
import { InventoryTransaction } from './entities/inventory-transaction.entity';
import { InventoryService } from './services/inventory.service';

@Module({
	imports: [TypeOrmModule.forFeature([InventoryItem, InventoryTransaction])],
	controllers: [AdminInventoryController],
	providers: [InventoryService],
	exports: [InventoryService, TypeOrmModule]
})
export class InventoryModule {}
