import * as React from "react"
import { useNavigate } from "react-router-dom"
import type { ColumnDef } from "@tanstack/react-table"
import { DataTable } from "@/components/shared/data-table"
import { ErrorNote, FilterTabs, PageHeader, StatusBadge } from "@/components/shared/page"
import { dateTime, npr } from "@/lib/money"
import { useOrders, type OrderSummary } from "./api"

const FILTERS = [
  { value: "CONFIRMED", label: "To pack" },
  { value: "PROCESSING", label: "Packing" },
  { value: "SHIPPED", label: "Shipped" },
  { value: "DELIVERED", label: "Delivered" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "", label: "All" },
]

const columns: ColumnDef<OrderSummary>[] = [
  { accessorKey: "order_number", header: "Order" },
  { accessorKey: "placed_at", header: "Placed", cell: ({ row }) => dateTime(row.original.placed_at) },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: "payment_method", header: "Payment", cell: ({ row }) => (row.original.payment_method === "COD" ? "Cash on delivery" : row.original.payment_method ?? "—") },
  { accessorKey: "item_count", header: "Items" },
  { id: "total", header: "Total", cell: ({ row }) => npr(row.original.total.amount_minor) },
]

export function OrdersPage() {
  const [status, setStatus] = React.useState("CONFIRMED")
  const orders = useOrders(status)
  const navigate = useNavigate()
  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Orders" description="Newest first. Open an order to pack, ship, deliver or cancel it." />
      <FilterTabs options={FILTERS} value={status} onChange={setStatus} />
      {orders.error ? <ErrorNote error={orders.error} /> : null}
      <DataTable
        columns={columns}
        data={orders.data?.items ?? []}
        isLoading={orders.isLoading}
        emptyMessage="Nothing waiting here."
        onRowClick={(o) => navigate(`/orders/${o.order_id}`)}
      />
      {orders.data?.has_more && <p className="text-xs text-[var(--color-ink-muted)]">Showing the newest 50.</p>}
    </div>
  )
}
