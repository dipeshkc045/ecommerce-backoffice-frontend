import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field, StatusBadge } from "@/components/shared/page"
import { usePermission } from "@/hooks/use-auth"
import { errorText, newIdempotencyKey } from "@/lib/api-client"
import { dateTime, npr, parseRupees } from "@/lib/money"
import { useAddSale, useCancelPrice, useSetPrice, useSkuPrice, type PriceChange, type PriceRow } from "./api"

/** A time typed in a datetime-local box (the browser's own time zone) as the ISO time the platform expects. */
function toIso(local: string): string | undefined {
  return local ? new Date(local).toISOString() : undefined
}

function describe(change: PriceChange): string {
  const kind = change.kind === "SALE" ? "Sale" : "Price"
  const when = change.kind === "SALE" ? ` ${dateTime(change.starts_at)} → ${dateTime(change.ends_at)}` : change.starts_at ? ` from ${dateTime(change.starts_at)}` : ""
  return `${kind} ${npr(change.proposed_minor)}${when}`
}

/** Price in NPR, VAT included: today's price, a sale, what is scheduled. Moves of more than ±20% need a second person. */
export function SkuPricePanel({ skuId }: { skuId: string }) {
  const price = useSkuPrice(skuId)
  const setPrice = useSetPrice(skuId)
  const addSale = useAddSale(skuId)
  const cancel = useCancelPrice(skuId)
  const canWrite = usePermission("pricing:write")
  const [amount, setAmount] = React.useState("")
  const [startsAt, setStartsAt] = React.useState("")
  const [saleAmount, setSaleAmount] = React.useState("")
  const [saleStart, setSaleStart] = React.useState("")
  const [saleEnd, setSaleEnd] = React.useState("")
  const [saleKey, setSaleKey] = React.useState(newIdempotencyKey) // reused if the same sale is retried after an error

  const submitPrice = (e: React.FormEvent) => {
    e.preventDefault()
    const minor = parseRupees(amount)
    if (minor === null || minor <= 0) return void toast.error("Enter a price in rupees, for example 1200 or 1,200.50")
    setPrice.mutate({ amountMinor: minor, startsAt: toIso(startsAt) }, {
      onSuccess: (r) => {
        setAmount(""); setStartsAt("")
        if (r.result === "AWAITING_APPROVAL") toast.warning("More than 20% change: waiting for a second person to approve")
        else if (r.result === "UNCHANGED") toast.info("That is already the price")
        else toast.success(startsAt ? "Price scheduled" : "Price updated")
      },
      onError: (err) => toast.error(errorText(err)),
    })
  }

  const submitSale = (e: React.FormEvent) => {
    e.preventDefault()
    const minor = parseRupees(saleAmount)
    if (minor === null || minor <= 0) return void toast.error("Enter the sale price in rupees")
    if (!saleEnd) return void toast.error("Choose when the sale ends")
    addSale.mutate({ key: saleKey, amountMinor: minor, startsAt: toIso(saleStart), endsAt: toIso(saleEnd)! }, {
      onSuccess: (r) => {
        setSaleAmount(""); setSaleStart(""); setSaleEnd(""); setSaleKey(newIdempotencyKey())
        if (r.result === "AWAITING_APPROVAL") toast.warning("A big sale discount waits for a second person to approve")
        else toast.success("Sale added")
      },
      onError: (err) => toast.error(errorText(err)),
    })
  }

  const now = Date.now()
  // The running regular price is the big number above; show what else is on the timeline
  const upcoming: PriceRow[] = (price.data?.schedule ?? []).filter(
    (r) => r.kind === "SALE" || new Date(r.valid_from).getTime() > now,
  )
  const pending = price.data?.pending_changes ?? (price.data?.pending_change ? [price.data.pending_change] : [])
  const onSale = price.data?.sale_minor != null

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Price</h3>
      {price.error ? <ErrorNote error={price.error} /> : null}
      <div className="flex items-baseline gap-3">
        <span className="text-2xl font-semibold">{price.isLoading ? "…" : npr(onSale ? price.data?.sale_minor : price.data?.amount_minor)}</span>
        {onSale && <><span className="text-sm text-[var(--color-ink-muted)] line-through">{npr(price.data?.amount_minor)}</span><StatusBadge status="PUBLISHED" /><span className="text-xs text-[var(--color-success)]">on sale</span></>}
      </div>
      {price.data?.amount_minor == null && !price.isLoading && (
        <p className="text-xs text-[var(--color-warning)]">No price yet: customers cannot buy this SKU.</p>
      )}

      {upcoming.length > 0 && (
        <ul className="flex flex-col gap-1 text-xs text-[var(--color-ink-muted)]">
          {upcoming.map((r) => (
            <li key={r.price_id} className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-ink)]">{r.kind === "SALE" ? "Sale" : "Price"} {npr(r.amount_minor)}</span>
              <span>{dateTime(r.valid_from)}{r.valid_to ? ` → ${dateTime(r.valid_to)}` : " onwards"}</span>
              {canWrite && (
                <Button variant="ghost" size="sm" disabled={cancel.isPending}
                  onClick={() => cancel.mutate(r.price_id, { onSuccess: () => toast.success(new Date(r.valid_from).getTime() <= now ? "Sale ended" : "Cancelled"), onError: (e) => toast.error(errorText(e)) })}>
                  {new Date(r.valid_from).getTime() <= now ? "End now" : "Cancel"}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      {pending.map((c) => (
        <div key={c.change_id} className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <StatusBadge status="PENDING" /> {describe(c)} asked by {c.requested_by}
        </div>
      ))}

      {canWrite && (
        <>
          <form onSubmit={submitPrice} className="flex flex-wrap items-end gap-2">
            <Field label="New price (Rs)"><Input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="1,200" className="w-32" /></Field>
            <Field label="From (blank: now)"><Input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} className="w-52" /></Field>
            <Button type="submit" variant="secondary" disabled={setPrice.isPending || !amount}>{startsAt ? "Schedule price" : "Set price"}</Button>
          </form>
          <form onSubmit={submitSale} className="flex flex-wrap items-end gap-2">
            <Field label="Sale price (Rs)"><Input value={saleAmount} onChange={(e) => { setSaleAmount(e.target.value); setSaleKey(newIdempotencyKey()) }} inputMode="decimal" className="w-32" /></Field>
            <Field label="From (blank: now)"><Input type="datetime-local" value={saleStart} onChange={(e) => { setSaleStart(e.target.value); setSaleKey(newIdempotencyKey()) }} className="w-52" /></Field>
            <Field label="Until"><Input type="datetime-local" value={saleEnd} onChange={(e) => { setSaleEnd(e.target.value); setSaleKey(newIdempotencyKey()) }} className="w-52" /></Field>
            <Button type="submit" variant="secondary" disabled={addSale.isPending || !saleAmount || !saleEnd}>Add sale</Button>
          </form>
        </>
      )}
    </div>
  )
}
