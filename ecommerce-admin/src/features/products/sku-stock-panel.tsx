import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field, selectClass } from "@/components/shared/page"
import { usePermission } from "@/hooks/use-auth"
import { errorText } from "@/lib/api-client"
import { ADJUST_REASONS, useAdjustStock, useReceiveStock, useSkuStock, type AdjustReason } from "./api"

/** Stock is changed only through the ledger: a delivery received, or an adjustment with a reason. */
export function SkuStockPanel({ skuId }: { skuId: string }) {
  const stock = useSkuStock(skuId)
  const receive = useReceiveStock(skuId)
  const adjust = useAdjustStock(skuId)
  const canWrite = usePermission("inventory:write")
  const [received, setReceived] = React.useState("")
  const [delta, setDelta] = React.useState("")
  const [reason, setReason] = React.useState<AdjustReason>("COUNT_CORRECTION")
  const [note, setNote] = React.useState("")

  const level = stock.data?.locations[0]

  const doReceive = (e: React.FormEvent) => {
    e.preventDefault()
    const quantity = Number(received)
    if (!Number.isInteger(quantity) || quantity < 1) return toast.error("Enter how many units arrived")
    receive.mutate({ quantity, note }, {
      onSuccess: () => { setReceived(""); toast.success(`Received ${quantity}`) },
      onError: (err) => toast.error(errorText(err)),
    })
  }

  const doAdjust = (e: React.FormEvent) => {
    e.preventDefault()
    const n = Number(delta)
    if (!Number.isInteger(n) || n === 0) return toast.error("Enter a change such as -2 or 3")
    adjust.mutate({ delta: n, reason, note }, {
      onSuccess: () => { setDelta(""); setNote(""); toast.success("Stock adjusted") },
      onError: (err) => toast.error(errorText(err)),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Stock</h3>
      {stock.error ? <ErrorNote error={stock.error} /> : null}
      <div className="flex gap-6 text-sm">
        <div><div className="text-2xl font-semibold">{stock.data?.available ?? "…"}</div><div className="text-xs text-[var(--color-ink-muted)]">available</div></div>
        <div><div className="text-lg">{level?.on_hand ?? 0}</div><div className="text-xs text-[var(--color-ink-muted)]">on hand</div></div>
        <div><div className="text-lg">{level?.reserved ?? 0}</div><div className="text-xs text-[var(--color-ink-muted)]">reserved for orders</div></div>
      </div>
      {canWrite && (
        <>
          <form onSubmit={doReceive} className="flex items-end gap-2">
            <Field label="Received">
              <Input value={received} onChange={(e) => setReceived(e.target.value)} inputMode="numeric" placeholder="12" className="w-24" />
            </Field>
            <Button type="submit" variant="secondary" disabled={receive.isPending || !received}>Receive</Button>
          </form>
          <form onSubmit={doAdjust} className="flex flex-wrap items-end gap-2">
            <Field label="Adjust by">
              <Input value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="-2" className="w-20" />
            </Field>
            <Field label="Reason">
              <select value={reason} onChange={(e) => setReason(e.target.value as AdjustReason)} className={selectClass}>
                {ADJUST_REASONS.map((r) => <option key={r} value={r}>{r.replace(/_/g, " ").toLowerCase()}</option>)}
              </select>
            </Field>
            <Field label="Note">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder={reason === "OTHER" ? "Required" : "Optional"} className="w-40" />
            </Field>
            <Button type="submit" variant="secondary" disabled={adjust.isPending || !delta}>Adjust</Button>
          </form>
        </>
      )}
      {!!stock.data?.recent_movements.length && (
        <ul className="text-xs text-[var(--color-ink-muted)]">
          {stock.data.recent_movements.slice(0, 5).map((m, i) => (
            <li key={i}>
              {m.type.toLowerCase()} {m.delta_on_hand > 0 ? "+" : ""}{m.delta_on_hand}{m.reason ? ` · ${m.reason}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
