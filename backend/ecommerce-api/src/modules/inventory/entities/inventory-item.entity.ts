import { Check, Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { ProductVariant } from '../../products/entities/product-variant.entity';

@Entity({ name: 'inventory_items' })
@Check('chk_inventory_non_negative', 'quantity_on_hand >= 0 AND quantity_reserved >= 0')
export class InventoryItem {
	@PrimaryGeneratedColumn('uuid')
	id!: string;

	@Column({ name: 'variant_id', type: 'uuid', unique: true })
	variantId!: string;

	@OneToOne(() => ProductVariant, (variant) => variant.inventoryItem, {
		onDelete: 'CASCADE'
	})
	@JoinColumn({ name: 'variant_id' })
	variant!: ProductVariant;

	@Column({ name: 'quantity_on_hand', type: 'integer', default: 0 })
	quantityOnHand!: number;

	@Column({ name: 'quantity_reserved', type: 'integer', default: 0 })
	quantityReserved!: number;

	@Column({ name: 'reorder_level', type: 'integer', default: 0 })
	reorderLevel!: number;

	@UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
	updatedAt!: Date;
}
