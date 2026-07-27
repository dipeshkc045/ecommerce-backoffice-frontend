import * as React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { DataTable } from "@/components/shared/data-table"
import { useOrders } from "./api"
import { orderColumns } from "./columns"

export function OrdersPage() {
  const { data: orders, isLoading } = useOrders('a49e4b47-52b7-45bb-9d99-b527d4214773')
  const [search, setSearch] = React.useState("")

  const filtered = React.useMemo(() => {
    if (!orders) return []
    const q = search.trim().toLowerCase()
    if (!q) return orders
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q)
    )
  }, [orders, search])

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">Orders</h1>
        <p className="text-sm text-[var(--color-ink-muted)]">
          {orders?.length ?? 0} orders total
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All orders</CardTitle>
          <CardDescription>Search, review status, and open an order for details.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-[var(--color-ink-faint)]" />
            <Input
              placeholder="Search order, customer, or email…"
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <DataTable
            columns={orderColumns}
            data={filtered}
            isLoading={isLoading}
            emptyMessage="No orders match your search."
            getRowId={(row) => row.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
