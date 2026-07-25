import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { stockStatus, type InventoryItem, type StockStatus } from "./types"

const STATUS_LABEL: Record<StockStatus, string> = {
  in_stock: "In stock",
  low_stock: "Low stock",
  out_of_stock: "Out of stock",
}

const STATUS_VARIANT: Record<StockStatus, "success" | "warning" | "danger"> = {
  in_stock: "success",
  low_stock: "warning",
  out_of_stock: "danger",
}

const currencyFormatter = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" })

export const inventoryColumns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "sku",
    header: "SKU",
    cell: ({ row }) => <span className="font-mono text-xs">{row.original.sku}</span>,
  },
  {
    accessorKey: "name",
    header: "Item",
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.original.name}</div>
        <div className="text-xs text-[var(--color-ink-faint)]">{row.original.category}</div>
      </div>
    ),
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = stockStatus(row.original)
      return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
    },
  },
  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => currencyFormatter.format(row.original.price),
  },
]
