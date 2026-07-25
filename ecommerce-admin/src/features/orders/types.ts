export type OrderStatus = "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded"

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  status: OrderStatus
  total: number
  currency: string
  itemCount: number
  createdAt: string
}
