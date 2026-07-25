export type StockStatus = "in_stock" | "low_stock" | "out_of_stock"

export interface InventoryItem {
  id: string
  sku: string
  name: string
  category: string
  quantity: number
  reorderThreshold: number
  price: number
  updatedAt: string
}

export function stockStatus(item: InventoryItem): StockStatus {
  if (item.quantity <= 0) return "out_of_stock"
  if (item.quantity <= item.reorderThreshold) return "low_stock"
  return "in_stock"
}
