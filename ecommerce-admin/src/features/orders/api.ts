import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"
import type { Order, OrderStatus } from "./types"

const ordersKey = {
  all: ["orders"] as const,
  detail: (id: string) => ["orders", id] as const,
}

// --- Mock data so the app runs before the real backend is wired up ---
const MOCK_ORDERS: Order[] = [
  { id: "1", orderNumber: "ORD-10231", customerName: "Priya Sharma", customerEmail: "priya@example.com", status: "processing", total: 128.5, currency: "USD", itemCount: 3, createdAt: "2026-07-24T10:12:00Z" },
  { id: "2", orderNumber: "ORD-10232", customerName: "Marcus Lee", customerEmail: "marcus@example.com", status: "shipped", total: 74.0, currency: "USD", itemCount: 1, createdAt: "2026-07-24T09:40:00Z" },
  { id: "3", orderNumber: "ORD-10233", customerName: "Elena Petrova", customerEmail: "elena@example.com", status: "pending", total: 342.99, currency: "USD", itemCount: 5, createdAt: "2026-07-23T18:02:00Z" },
  { id: "4", orderNumber: "ORD-10234", customerName: "Sam O'Connor", customerEmail: "sam@example.com", status: "delivered", total: 19.99, currency: "USD", itemCount: 1, createdAt: "2026-07-22T14:22:00Z" },
  { id: "5", orderNumber: "ORD-10235", customerName: "Ravi Kumar", customerEmail: "ravi@example.com", status: "cancelled", total: 210.0, currency: "USD", itemCount: 2, createdAt: "2026-07-21T08:15:00Z" },
]

function mockFetchOrders(): Promise<Order[]> {
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_ORDERS), 300))
}
// --- end mock; delete once the real API exists ---

export function useOrders() {
  return useQuery({
    queryKey: ordersKey.all,
    queryFn: () => mockFetchOrders(), // swap for: apiClient.get<Order[]>("/orders")
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) =>
      apiClient.patch<Order>(`/orders/${id}`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersKey.all })
    },
  })
}
