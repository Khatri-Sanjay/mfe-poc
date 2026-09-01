export interface InventoryItem {
  id: string;
  variantId: string;
  sku: string;
  productName: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderLevel?: number;
}
