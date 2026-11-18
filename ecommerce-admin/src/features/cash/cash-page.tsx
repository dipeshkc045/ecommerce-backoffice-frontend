import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field, Loading, PageHeader } from "@/components/shared/page"
import { usePermission } from "@/hooks/use-auth"
import { apiClient, errorText } from "@/lib/api-client"
import { dateTime, npr, parseRupees } from "@/lib/money"

interface Outstanding {
  couriers: { courier: string; order_count: number; total_minor: number; oldest_collected_at: string }[]
  orders: { order_id: string; order_number: string; courier: string; amount_minor: number; collected_at: string }[]
}

/** Cash couriers collected for us and have not paid over yet, and recording a courier's remittance (ecommerce-platform #40). */
export function CashPage() {
  const qc = useQueryClient()
  const canRecord = usePermission("payments:collect")
  const outstanding = useQuery({ queryKey: ["cod", "outstanding"], queryFn: () => apiClient.get<Outstanding>("/admin/v1/cod/outstanding") })
  const [courier, setCourier] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [reference, setReference] = React.useState("")
  const [total, setTotal] = React.useState("")

  const orders = (outstanding.data?.orders ?? []).filter((o) => o.courier === courier)
  const selectedSum = orders.filter((o) => selected.has(o.order_id)).reduce((s, o) => s + o.amount_minor, 0)

  const remit = useMutation({
    mutationFn: () =>
      apiClient.post("/admin/v1/cod/remittances", {
        courier, reference, order_ids: [...selected], expected_total_minor: parseRupees(total),
      }),
    onSuccess: () => {
      toast.success(`Recorded ${npr(parseRupees(total))} from ${courier}`)
      setSelected(new Set()); setReference(""); setTotal("")
    },
    onError: (e) => toast.error(errorText(e)),
    onSettled: () => qc.invalidateQueries({ queryKey: ["cod"] }),
  })

  const choose = (c: string) => { setCourier(c); setSelected(new Set()) }
  const toggle = (id: string) => setSelected((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })

  return (
    <div className="flex flex-col gap-5">
      <PageHeader title="Cash on delivery" description="What each courier holds for us. Record a remittance against the exact orders on the courier's statement." />
      {outstanding.isLoading && <Loading />}
      {outstanding.error ? <ErrorNote error={outstanding.error} /> : null}
      {outstanding.data?.couriers.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No courier owes anything.</p>}
      <div className="grid gap-3 md:grid-cols-3">
        {outstanding.data?.couriers.map((c) => (
          <button key={c.courier} type="button" onClick={() => choose(c.courier)} className="text-left">
            <Card className={courier === c.courier ? "ring-2 ring-[var(--color-accent)]" : ""}>
              <CardHeader>
                <CardDescription>{c.courier}</CardDescription>
                <CardTitle className="text-xl">{npr(c.total_minor)}</CardTitle>
                <CardDescription>{c.order_count} orders · oldest {dateTime(c.oldest_collected_at)}</CardDescription>
              </CardHeader>
            </Card>
          </button>
        ))}
      </div>

      {courier && (
        <Card>
          <CardHeader>
            <CardTitle>{courier}: outstanding orders</CardTitle>
            <CardDescription>Tick the orders on the courier's statement. Nothing is recorded unless the total matches exactly.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <table className="w-full text-sm">
              <tbody>
                {orders.map((o) => (
                  <tr key={o.order_id} className="border-b border-[var(--color-border)] last:border-0">
                    <td className="py-2 w-8">{canRecord && <input type="checkbox" className="size-4" aria-label={`Include ${o.order_number}`} checked={selected.has(o.order_id)} onChange={() => toggle(o.order_id)} />}</td>
                    <td className="py-2">{o.order_number}</td>
                    <td className="py-2 text-[var(--color-ink-muted)]">{dateTime(o.collected_at)}</td>
                    <td className="py-2 text-right">{npr(o.amount_minor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canRecord && (
              <form onSubmit={(e) => { e.preventDefault(); remit.mutate() }} className="flex flex-wrap items-end gap-3">
                <Field label="Statement reference"><Input value={reference} onChange={(e) => setReference(e.target.value)} required maxLength={80} placeholder="NCM-2026-11-13" /></Field>
                <Field label="Total on statement (Rs)" hint={`Ticked orders add up to ${npr(selectedSum)}`}>
                  <Input value={total} onChange={(e) => setTotal(e.target.value)} required inputMode="decimal" className="w-40" />
                </Field>
                <Button type="submit" disabled={remit.isPending || selected.size === 0 || parseRupees(total) === null}>Record remittance</Button>
              </form>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
