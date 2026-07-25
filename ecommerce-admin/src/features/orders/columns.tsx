import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import type { Order, OrderStatus } from "./types"

const STATUS_VARIANT: Record<OrderStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  pending: "neutral",
  processing: "accent",
  shipped: "accent",
  delivered: "success",
  cancelled: "danger",
  refunded: "warning",
}

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })
const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" })

export const orderColumns: ColumnDef<Order>[] = [
  {
    accessorKey: "orderNumber",
    header: "Order",
    cell: ({ row }) => <span className="font-medium">{row.original.orderNumber}</span>,
  },
  {
    accessorKey: "customerName",
    header: "Customer",
    cell: ({ row }) => (
      <div>
        <div>{row.original.customerName}</div>
        <div className="text-xs text-[var(--color-ink-faint)]">{row.original.customerEmail}</div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant={STATUS_VARIANT[row.original.status]}>{row.original.status}</Badge>
    ),
  },
  {
    accessorKey: "itemCount",
    header: "Items",
  },
  {
    accessorKey: "total",
    header: "Total",
    cell: ({ row }) => currencyFormatter.format(row.original.total),
  },
  {
    accessorKey: "createdAt",
    header: "Placed",
    cell: ({ row }) => dateFormatter.format(new Date(row.original.createdAt)),
  },
]
