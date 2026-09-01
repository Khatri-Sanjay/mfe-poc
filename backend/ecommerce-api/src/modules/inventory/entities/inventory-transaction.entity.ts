import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { InventoryTransactionType } from '../enums/inventory-transaction-type.enum';
import { InventoryItem } from './inventory-item.entity';

@Entity({ name: 'inventory_transactions' })
export class InventoryTransaction {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Index('idx_inventory_transactions_inventory_item_id')
	@Column({ name: 'inventory_item_id', type: 'uuid' })
	inventoryItemId!: string;

	@ManyToOne(() => InventoryItem, { onDelete: 'CASCADE' })
	@JoinColumn({ name: 'inventory_item_id' })
	inventoryItem!: InventoryItem;

	@Column({ name: 'type', type: 'enum', enum: InventoryTransactionType })
	type!: InventoryTransactionType;

	@Column({ name: 'quantity_delta', type: 'integer' })
	quantityDelta!: number;

	@Column({ name: 'note', type: 'varchar', length: 500, nullable: true })
	note!: string | null;

	@Column({ name: 'created_by', type: 'uuid', nullable: true })
	createdBy!: string | null;

	@CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
	createdAt!: Date;
}
