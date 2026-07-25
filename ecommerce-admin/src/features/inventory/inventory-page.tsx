import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import { usePermission } from "@/hooks/use-auth"
import { useInventory } from "./api"
import { inventoryColumns } from "./columns"
import { AdjustStockDialog } from "./adjust-stock-dialog"
import type { InventoryItem } from "./types"

export function InventoryPage() {
  const { data: items, isLoading } = useInventory()
  const [search, setSearch] = React.useState("")
  const [editing, setEditing] = React.useState<InventoryItem | null>(null)
  const canEdit = usePermission("inventory:edit")

  const filtered = React.useMemo(() => {
    if (!items) return []
    const q = search.trim().toLowerCase()
    if (!q) return items
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q)
    )
  }, [items, search])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Inventory</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {items?.length ?? 0} SKUs tracked
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All items</CardTitle>
          <CardDescription>
            {canEdit
              ? "Search, review stock levels, and click a row to adjust quantity."
              : "Search and review stock levels. You have view-only access."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <Input
              placeholder="Search SKU, name, or category…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DataTable
            columns={inventoryColumns}
            data={filtered}
            isLoading={isLoading}
            emptyMessage="No items match your search."
            getRowId={(row) => row.id}
            onRowClick={canEdit ? (row) => setEditing(row) : undefined}
          />
        </CardContent>
      </Card>

      <AdjustStockDialog item={editing} onOpenChange={(open) => !open && setEditing(null)} />
    </div>
  )
}
