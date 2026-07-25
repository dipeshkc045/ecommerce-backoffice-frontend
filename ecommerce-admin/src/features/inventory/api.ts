import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { InventoryItem } from "./types"

const inventoryKey = {
  all: ["inventory"] as const,
}

// --- Mock data so the app runs before the real backend is wired up ---
const MOCK_ITEMS: InventoryItem[] = [
  { id: "1", sku: "TS-BLK-M", name: "Classic Tee — Black / M", category: "Apparel", quantity: 142, reorderThreshold: 25, price: 24.0, updatedAt: "2026-07-24T08:00:00Z" },
  { id: "2", sku: "TS-BLK-L", name: "Classic Tee — Black / L", category: "Apparel", quantity: 18, reorderThreshold: 25, price: 24.0, updatedAt: "2026-07-24T08:00:00Z" },
  { id: "3", sku: "MG-CRM-01", name: "Ceramic Mug — Cream", category: "Home", quantity: 0, reorderThreshold: 10, price: 14.5, updatedAt: "2026-07-22T11:30:00Z" },
  { id: "4", sku: "NB-A5-DOT", name: "Dot-grid Notebook A5", category: "Stationery", quantity: 87, reorderThreshold: 20, price: 9.99, updatedAt: "2026-07-23T15:45:00Z" },
  { id: "5", sku: "TB-STL-750", name: "Steel Tumbler 750ml", category: "Home", quantity: 6, reorderThreshold: 15, price: 21.0, updatedAt: "2026-07-21T09:10:00Z" },
]

const store = [...MOCK_ITEMS]

function mockFetchInventory(): Promise<InventoryItem[]> {
  return new Promise((resolve) => setTimeout(() => resolve([...store]), 300))
}

function mockAdjustStock(id: string, delta: number): Promise<InventoryItem> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const item = store.find((i) => i.id === id)
      if (!item) return reject(new Error("Item not found"))
      item.quantity = Math.max(0, item.quantity + delta)
      item.updatedAt = new Date().toISOString()
      resolve({ ...item })
    }, 250)
  })
}
// --- end mock; delete once the real API exists ---

export function useInventory() {
  return useQuery({
    queryKey: inventoryKey.all,
    queryFn: () => mockFetchInventory(), // swap for: apiClient.get<InventoryItem[]>("/inventory")
  })
}

export function useAdjustStock() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, delta }: { id: string; delta: number }) =>
      mockAdjustStock(id, delta), // swap for: apiClient.patch(`/inventory/${id}/adjust`, { delta })
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKey.all })
    },
  })
}
