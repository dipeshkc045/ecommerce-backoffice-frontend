import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

// ── Shapes of /admin/v1/orders (ecommerce-platform #38) ───────────────────────────────────────────────────────────

export type OrderStatus = "PENDING_PAYMENT" | "CONFIRMED" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "COMPLETED" | "CANCELLED"

export interface Money {
  amount_minor: number
  currency: string
}

export interface OrderSummary {
  order_id: string
  order_number: string
  status: OrderStatus
  payment_method: "KHALTI" | "COD" | null
  total: Money
  item_count: number
  placed_at: string
}

export interface OrderPage {
  items: OrderSummary[]
  next_cursor: string | null
  has_more: boolean
}

export interface OrderDetail {
  order: OrderSummary
  customer_id: string
  lines: { sku_code: string; product_name: string; option: string; quantity: number; line_total: Money }[]
  shipping_total: Money
  ship_to: {
    recipient_name: string
    phone: string
    province: string
    district: string
    municipality: string
    ward: number
    street: string | null
    landmark: string
  } | null
  shipment: { courier: string; tracking_number: string; shipped_at: string } | null
  history: { from_status: string | null; to_status: string; reason: string | null; actor_id: string | null; at: string }[]
}

const keys = {
  list: (status: string) => ["orders", "list", status] as const,
  one: (id: string) => ["orders", "one", id] as const,
}

export function useOrders(status: string) {
  return useQuery({
    queryKey: keys.list(status),
    queryFn: () => apiClient.get<OrderPage>(`/admin/v1/orders?limit=50${status ? `&status=${status}` : ""}`),
    refetchInterval: 30_000, // a work list: new orders appear without a reload
  })
}

export function useOrder(id: string) {
  return useQuery({ queryKey: keys.one(id), queryFn: () => apiClient.get<OrderDetail>(`/admin/v1/orders/${id}`) })
}

export type OrderAction =
  | { kind: "start-processing" }
  | { kind: "ship"; courier: string; tracking_number: string }
  | { kind: "deliver" }
  | { kind: "cancel"; reason: string }

/** Each action is safe to repeat: the platform answers a repeat with the order as it is. */
export function useOrderAction(orderId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (action: OrderAction) => {
      const { kind, ...body } = action
      return apiClient.post<{ status: OrderStatus }>(`/admin/v1/orders/${orderId}/${kind}`, body)
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.one(orderId) })
      qc.invalidateQueries({ queryKey: ["orders", "list"] })
      qc.invalidateQueries({ queryKey: ["cod"] })
    },
  })
}
