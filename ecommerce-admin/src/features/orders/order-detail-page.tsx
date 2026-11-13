import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field, Loading, PageHeader, StatusBadge } from "@/components/shared/page"
import { usePermission } from "@/hooks/use-auth"
import { errorText } from "@/lib/api-client"
import { dateTime, npr } from "@/lib/money"
import { useOrder, useOrderAction, type OrderAction, type OrderDetail } from "./api"

export function OrderDetailPage() {
  const { id = "" } = useParams()
  const order = useOrder(id)
  if (order.isLoading) return <Loading />
  if (order.error || !order.data) return <ErrorNote error={order.error ?? "Order not found"} />
  return <OrderView detail={order.data} />
}

function OrderView({ detail }: { detail: OrderDetail }) {
  const { order, ship_to: to, shipment } = detail
  const canFulfil = usePermission("orders:fulfil")
  const act = useOrderAction(order.order_id)
  const [dialog, setDialog] = React.useState<"ship" | "cancel" | null>(null)

  const run = (action: OrderAction, done: string) =>
    act.mutate(action, {
      onSuccess: () => {
        setDialog(null)
        toast.success(done)
      },
      onError: (e) => toast.error(errorText(e)),
    })

  return (
    <div className="flex flex-col gap-5">
      <Link to="/orders" className="flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="size-4" /> Orders
      </Link>
      <PageHeader
        title={`Order ${order.order_number}`}
        description={`Placed ${dateTime(order.placed_at)} · ${order.payment_method === "COD" ? "Cash on delivery" : order.payment_method ?? ""} · ${npr(order.total.amount_minor)}`}
        actions={
          <>
            <StatusBadge status={order.status} />
            {canFulfil && order.status === "CONFIRMED" && (
              <Button disabled={act.isPending} onClick={() => run({ kind: "start-processing" }, "Packing started")}>Start packing</Button>
            )}
            {canFulfil && order.status === "PROCESSING" && <Button onClick={() => setDialog("ship")}>Hand to courier</Button>}
            {canFulfil && order.status === "SHIPPED" && (
              <Button disabled={act.isPending} onClick={() => run({ kind: "deliver" }, order.payment_method === "COD" ? "Delivered; cash recorded against the courier" : "Delivered")}>
                Mark delivered
              </Button>
            )}
            {canFulfil && (order.status === "CONFIRMED" || order.status === "PROCESSING") && (
              <Button variant="destructive" onClick={() => setDialog("cancel")}>Cancel order</Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Deliver to</CardTitle></CardHeader>
          <CardContent className="text-sm">
            {to ? (
              <address className="not-italic leading-6">
                <strong>{to.recipient_name}</strong> · {to.phone}<br />
                {[to.street, `Ward ${to.ward}`, to.municipality].filter(Boolean).join(", ")}<br />
                {to.district}, {to.province}<br />
                <span className="text-[var(--color-ink-muted)]">Landmark: {to.landmark}</span>
              </address>
            ) : (
              <span className="text-[var(--color-ink-muted)]">No address on this order.</span>
            )}
            {shipment && (
              <p className="mt-3 text-[var(--color-ink-muted)]">
                Shipped {dateTime(shipment.shipped_at)} with <strong className="text-[var(--color-ink)]">{shipment.courier}</strong>, tracking {shipment.tracking_number}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>History</CardTitle></CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2 text-sm">
              {detail.history.map((h, i) => (
                <li key={i} className="flex flex-wrap items-center gap-2">
                  <span className="w-36 text-xs text-[var(--color-ink-muted)]">{dateTime(h.at)}</span>
                  <StatusBadge status={h.to_status} />
                  {h.reason && <span className="text-xs text-[var(--color-ink-muted)]">{h.reason}</span>}
                  <span className="text-xs text-[var(--color-ink-faint)]">{h.actor_id ? "staff" : "system"}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Items</CardTitle></CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {detail.lines.map((l, i) => (
                <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
                  <td className="py-2">{l.product_name} <span className="text-[var(--color-ink-muted)]">{l.option}</span><div className="text-xs text-[var(--color-ink-faint)]">{l.sku_code}</div></td>
                  <td className="py-2 text-right">× {l.quantity}</td>
                  <td className="py-2 text-right">{npr(l.line_total.amount_minor)}</td>
                </tr>
              ))}
              <tr><td className="py-2 text-[var(--color-ink-muted)]">Delivery</td><td /><td className="py-2 text-right">{npr(detail.shipping_total.amount_minor)}</td></tr>
              <tr className="font-semibold"><td className="py-2">Total (VAT included)</td><td /><td className="py-2 text-right">{npr(order.total.amount_minor)}</td></tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {dialog === "ship" && <ShipDialog pending={act.isPending} error={act.error} onClose={() => setDialog(null)} onSubmit={(courier, tracking) => run({ kind: "ship", courier, tracking_number: tracking }, "Handed to the courier")} />}
      {dialog === "cancel" && <CancelDialog paid={order.payment_method === "KHALTI"} pending={act.isPending} error={act.error} onClose={() => setDialog(null)} onSubmit={(reason) => run({ kind: "cancel", reason }, "Cancelled; stock is back on sale")} />}
    </div>
  )
}

function ShipDialog({ pending, error, onClose, onSubmit }: { pending: boolean; error: unknown; onClose: () => void; onSubmit: (courier: string, tracking: string) => void }) {
  const [courier, setCourier] = React.useState("")
  const [tracking, setTracking] = React.useState("")
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(courier, tracking) }} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Hand to courier</DialogTitle>
            <DialogDescription>The customer gets an SMS with the courier and tracking number.</DialogDescription>
          </DialogHeader>
          <Field label="Courier"><Input value={courier} onChange={(e) => setCourier(e.target.value)} required maxLength={60} placeholder="Nepal Can Move" list="couriers" /></Field>
          <datalist id="couriers"><option value="Nepal Can Move" /><option value="Pathao" /><option value="Upaya" /></datalist>
          <Field label="Tracking number"><Input value={tracking} onChange={(e) => setTracking(e.target.value)} required maxLength={80} /></Field>
          {error ? <ErrorNote error={error} /> : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Back</Button>
            <Button type="submit" disabled={pending}>Mark shipped</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function CancelDialog({ paid, pending, error, onClose, onSubmit }: { paid: boolean; pending: boolean; error: unknown; onClose: () => void; onSubmit: (reason: string) => void }) {
  const [reason, setReason] = React.useState("")
  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(reason) }} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Cancel this order?</DialogTitle>
            <DialogDescription>
              The stock goes back on sale. {paid ? "The Khalti payment is refunded to the customer." : "No cash will be collected."} This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Field label="Reason" hint="Kept in the order history and the audit trail.">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={200} placeholder="Customer called to cancel" />
          </Field>
          {error ? <ErrorNote error={error} /> : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Keep the order</Button>
            <Button type="submit" variant="destructive" disabled={pending || !reason.trim()}>Cancel order</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
