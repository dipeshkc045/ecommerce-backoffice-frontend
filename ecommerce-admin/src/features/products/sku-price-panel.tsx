import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field, StatusBadge } from "@/components/shared/page"
import { usePermission } from "@/hooks/use-auth"
import { errorText } from "@/lib/api-client"
import { npr, parseRupees } from "@/lib/money"
import { useSetPrice, useSkuPrice } from "./api"

/** Price in NPR, VAT included. A change of more than ±20% waits for a second person (Price approvals). */
export function SkuPricePanel({ skuId }: { skuId: string }) {
  const price = useSkuPrice(skuId)
  const setPrice = useSetPrice(skuId)
  const canWrite = usePermission("pricing:write")
  const [text, setText] = React.useState("")

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const minor = parseRupees(text)
    if (minor === null || minor <= 0) {
      toast.error("Enter a price in rupees, for example 1200 or 1,200.50")
      return
    }
    setPrice.mutate(minor, {
      onSuccess: (r) => {
        setText("")
        if (r.result === "AWAITING_APPROVAL") toast.warning("More than 20% change: waiting for a second person to approve")
        else if (r.result === "UNCHANGED") toast.info("That is already the price")
        else toast.success("Price updated")
      },
      onError: (err) => toast.error(errorText(err)),
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-sm font-semibold">Price</h3>
      {price.error ? <ErrorNote error={price.error} /> : null}
      <div className="text-2xl font-semibold">{price.isLoading ? "…" : npr(price.data?.amount_minor)}</div>
      {price.data?.amount_minor == null && !price.isLoading && (
        <p className="text-xs text-[var(--color-warning)]">No price yet: customers cannot buy this SKU.</p>
      )}
      {price.data?.pending_change && (
        <div className="flex items-center gap-2 text-xs text-[var(--color-ink-muted)]">
          <StatusBadge status="PENDING" /> {npr(price.data.pending_change.proposed_minor)} asked by {price.data.pending_change.requested_by}
        </div>
      )}
      {canWrite && (
        <form onSubmit={submit} className="flex items-end gap-2">
          <Field label="New price (Rs)">
            <Input value={text} onChange={(e) => setText(e.target.value)} inputMode="decimal" placeholder="1,200" className="w-40" />
          </Field>
          <Button type="submit" variant="secondary" disabled={setPrice.isPending || !text}>Set price</Button>
        </form>
      )}
    </div>
  )
}
