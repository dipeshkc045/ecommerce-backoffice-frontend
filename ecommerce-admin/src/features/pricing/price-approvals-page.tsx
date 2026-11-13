import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ErrorNote, Loading, PageHeader } from "@/components/shared/page"
import { useAuth, usePermission } from "@/hooks/use-auth"
import { apiClient, errorText } from "@/lib/api-client"
import { dateTime, npr } from "@/lib/money"
import type { PriceChange } from "@/features/products/api"

/** Price moves of more than ±20% wait here for someone other than the person who asked (ecommerce-platform #37). */
export function PriceApprovalsPage() {
  const qc = useQueryClient()
  const { user } = useAuth()
  const canDecide = usePermission("pricing:write")
  const changes = useQuery({
    queryKey: ["price-changes", "PENDING"],
    queryFn: () => apiClient.get<{ items: PriceChange[] }>("/admin/v1/price-changes?status=PENDING"),
  })
  const decide = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => apiClient.post(`/admin/v1/price-changes/${id}/${action}`),
    onSuccess: (_d, { action }) => toast.success(action === "approve" ? "Approved: the new price is live" : "Rejected: the price stays as it was"),
    onError: (e) => toast.error(errorText(e)),
    onSettled: () => qc.invalidateQueries({ queryKey: ["price-changes"] }),
  })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Price approvals" description="A second person checks every price move of more than 20%, so a typo never reaches customers." />
      {changes.isLoading && <Loading />}
      {changes.error ? <ErrorNote error={changes.error} /> : null}
      {changes.data?.items.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">Nothing waiting.</p>}
      {changes.data?.items.map((c) => {
        const mine = c.requested_by === user?.username
        const pct = c.current_minor ? Math.round(((c.proposed_minor - c.current_minor) / c.current_minor) * 100) : null
        return (
          <Card key={c.change_id}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
              <div className="text-sm">
                <div className="font-medium">
                  {npr(c.current_minor)} → {npr(c.proposed_minor)} {pct !== null && <span className={pct > 0 ? "text-[var(--color-warning)]" : "text-[var(--color-danger)]"}>({pct > 0 ? "+" : ""}{pct}%)</span>}
                </div>
                <div className="text-xs text-[var(--color-ink-muted)]">SKU {c.sku_id.slice(0, 8)} · asked by {c.requested_by} · {dateTime(c.requested_at)}</div>
              </div>
              {canDecide && (
                mine ? (
                  <span className="text-xs text-[var(--color-ink-muted)]">You asked for this one; someone else must decide.</span>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="secondary" disabled={decide.isPending} onClick={() => decide.mutate({ id: c.change_id, action: "reject" })}>Reject</Button>
                    <Button disabled={decide.isPending} onClick={() => decide.mutate({ id: c.change_id, action: "approve" })}>Approve</Button>
                  </div>
                )
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
