import { useQuery } from "@tanstack/react-query"
import { Link } from "react-router-dom"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { PageHeader } from "@/components/shared/page"
import { useAuth, usePermission } from "@/hooks/use-auth"
import { apiClient } from "@/lib/api-client"
import { npr } from "@/lib/money"
import type { OrderPage } from "@/features/orders/api"

function count(page: OrderPage | undefined) {
  if (!page) return "…"
  return page.has_more ? `${page.items.length}+` : String(page.items.length)
}

/** What needs doing now. Each tile shows only for staff who can act on it. */
export function DashboardPage() {
  const { user } = useAuth()
  const canOrders = usePermission("orders:view")
  const canPrices = usePermission("pricing:write")
  const canCash = usePermission("payments:view")
  const orders = (status: string) => apiClient.get<OrderPage>(`/admin/v1/orders?status=${status}&limit=50`)
  const toPack = useQuery({ queryKey: ["orders", "list", "CONFIRMED"], queryFn: () => orders("CONFIRMED"), enabled: canOrders })
  const packing = useQuery({ queryKey: ["orders", "list", "PROCESSING"], queryFn: () => orders("PROCESSING"), enabled: canOrders })
  const shipped = useQuery({ queryKey: ["orders", "list", "SHIPPED"], queryFn: () => orders("SHIPPED"), enabled: canOrders })
  const approvals = useQuery({
    queryKey: ["price-changes", "PENDING"],
    queryFn: () => apiClient.get<{ items: unknown[] }>("/admin/v1/price-changes?status=PENDING"),
    enabled: canPrices,
  })
  const cash = useQuery({
    queryKey: ["cod", "outstanding"],
    queryFn: () => apiClient.get<{ couriers: { total_minor: number }[] }>("/admin/v1/cod/outstanding"),
    enabled: canCash,
  })

  const tiles = [
    canOrders && { to: "/orders", label: "Orders to pack", value: count(toPack.data) },
    canOrders && { to: "/orders", label: "Being packed", value: count(packing.data) },
    canOrders && { to: "/orders", label: "With couriers", value: count(shipped.data) },
    canPrices && { to: "/price-approvals", label: "Price changes to approve", value: approvals.data ? String(approvals.data.items.length) : "…" },
    canCash && { to: "/cash", label: "Cash couriers owe us", value: cash.data ? npr(cash.data.couriers.reduce((s, c) => s + c.total_minor, 0)) : "…" },
  ].filter(Boolean) as { to: string; label: string; value: string }[]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title={`Namaste, ${user?.username ?? ""}`} description="What needs doing now." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((t) => (
          <Link key={t.label} to={t.to}>
            <Card className="transition-colors hover:border-[var(--color-accent)]">
              <CardHeader>
                <CardDescription>{t.label}</CardDescription>
                <CardTitle className="text-2xl font-semibold">{t.value}</CardTitle>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
