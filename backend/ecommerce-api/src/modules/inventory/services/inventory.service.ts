import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ErrorCode } from '../../../common/enums/error-code.enum';
import { createPaginationMeta } from '../../../common/utils/pagination.util';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { InventoryAdjustmentDto } from '../dto/inventory-adjustment.dto';
import { InventoryResponseDto } from '../dto/inventory-response.dto';
import { InventoryItem } from '../entities/inventory-item.entity';
import { InventoryTransaction } from '../entities/inventory-transaction.entity';
import { InventoryTransactionType } from '../enums/inventory-transaction-type.enum';

const mapInventory = (item: InventoryItem): InventoryResponseDto => ({
	id: item.id,
	variantId: item.variantId,
	sku: item.variant.sku,
	productName: item.variant.product.name,
	quantityOnHand: item.quantityOnHand,
	quantityReserved: item.quantityReserved,
	quantityAvailable: item.quantityOnHand - item.quantityReserved,
	reorderLevel: item.reorderLevel
});

@Injectable()
export class InventoryService {
	constructor(
		private readonly dataSource: DataSource,
		@InjectRepository(InventoryItem)
		private readonly inventoryRepository: Repository<InventoryItem>
	) {}

	async list(query: PaginationQueryDto) {
		const [items, total] = await this.inventoryRepository.findAndCount({
			relations: { variant: { product: true } },
			skip: (query.page - 1) * query.limit,
			take: query.limit,
			order: { updatedAt: query.sortOrder.toUpperCase() as 'ASC' | 'DESC' }
		});
		return {
			items: items.map(mapInventory),
			meta: createPaginationMeta(query.page, query.limit, total)
		};
	}

	async getByVariantId(variantId: string): Promise<InventoryResponseDto> {
		return mapInventory(await this.findByVariantIdOrFail(variantId));
	}

	async adjust(variantId: string, dto: InventoryAdjustmentDto, userId?: string): Promise<InventoryResponseDto> {
		await this.dataSource.transaction(async (manager) => {
			const item = await manager.findOne(InventoryItem, {
				where: { variantId },
				lock: { mode: 'pessimistic_write' }
			});
			if (!item) {
				throw new NotFoundException({
					errorCode: ErrorCode.ResourceNotFound,
					message: 'Inventory item was not found'
				});
			}

			const nextQuantity = item.quantityOnHand + dto.quantityDelta;
			if (nextQuantity < item.quantityReserved || nextQuantity < 0) {
				throw new ConflictException({
					errorCode: ErrorCode.OutOfStock,
					message: 'Inventory quantity cannot become invalid'
				});
			}

			item.quantityOnHand = nextQuantity;
			await manager.save(item);
			await manager.save(
				manager.create(InventoryTransaction, {
					inventoryItemId: item.id,
					type: InventoryTransactionType.Adjustment,
					quantityDelta: dto.quantityDelta,
					note: dto.note ?? null,
					createdBy: userId ?? null
				})
			);
		});
		return this.getByVariantId(variantId);
	}

	private async findByVariantIdOrFail(variantId: string): Promise<InventoryItem> {
		const item = await this.inventoryRepository.findOne({
			where: { variantId },
			relations: { variant: { product: true } }
		});
		if (!item) {
			throw new NotFoundException({
				errorCode: ErrorCode.ResourceNotFound,
				message: 'Inventory item was not found'
			});
		}
		return item;
	}
}
