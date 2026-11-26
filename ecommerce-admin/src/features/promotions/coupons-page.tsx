import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { ErrorNote, Field, PageHeader } from "@/components/shared/page"
import { RequirePermission, usePermission } from "@/hooks/use-auth"
import { errorText, newIdempotencyKey } from "@/lib/api-client"
import { dateTime, npr, parseRupees } from "@/lib/money"
import { categoriesApi, flattenTree } from "@/features/catalog/api"
import { useProducts } from "@/features/products/api"
import {
  couponState, parsePercent, percentText, toInstant, toLocalInput, useCoupons, useCreateCoupon, useEditCoupon, useSetCouponStatus,
  type Coupon, type CouponInput, type CouponKind, type CouponScope, type CouponState,
} from "./api"

const STATE_VARIANT: Record<CouponState, "success" | "neutral" | "warning" | "danger"> = {
  live: "success", scheduled: "warning", expired: "neutral", "used up": "neutral", disabled: "danger",
}

const offText = (c: Coupon) => (c.kind === "PERCENT" ? `${percentText(c.percent_bp)} %${c.max_discount_minor != null ? ` (up to ${npr(c.max_discount_minor)})` : ""}` : npr(c.amount_minor))
const scopeText = (c: Coupon) => (c.scope === "ALL" ? "Everything" : `${c.scope_ids.length} ${c.scope === "CATEGORY" ? "categories" : "products"}`)

const columns: ColumnDef<Coupon>[] = [
  { accessorKey: "code", header: "Code", cell: ({ row }) => <span className="font-mono text-sm font-medium">{row.original.code}</span> },
  { id: "off", header: "Takes off", cell: ({ row }) => offText(row.original) },
  { id: "scope", header: "Applies to", cell: ({ row }) => scopeText(row.original) },
  { id: "valid", header: "Valid", cell: ({ row }) => `${dateTime(row.original.valid_from)} → ${dateTime(row.original.valid_to)}` },
  {
    id: "uses", header: "Used",
    cell: ({ row }) => `${row.original.redemptions}${row.original.global_limit != null ? ` of ${row.original.global_limit}` : ""}`,
  },
  { id: "given", header: "Discount given", cell: ({ row }) => npr(row.original.discount_given_minor) },
  { id: "state", header: "Status", cell: ({ row }) => { const s = couponState(row.original); return <Badge variant={STATE_VARIANT[s]}>{s}</Badge> } },
]

export function CouponsPage() {
  const coupons = useCoupons()
  const [editing, setEditing] = React.useState<Coupon | null | undefined>(undefined) // undefined: closed, null: new
  const items = React.useMemo(() => coupons.data ?? [], [coupons.data])
  const totals = React.useMemo(() => ({
    redemptions: items.reduce((n, c) => n + c.redemptions, 0),
    given: items.reduce((n, c) => n + c.discount_given_minor, 0),
    live: items.filter((c) => couponState(c) === "live").length,
  }), [items])
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Coupons"
        description="Codes customers type in the cart. A coupon that has been used keeps its discount terms; create a new one to change them."
        actions={
          <RequirePermission permission="promotions:write">
            <Button onClick={() => setEditing(null)}><Plus /> New coupon</Button>
          </RequirePermission>
        }
      />
      {coupons.error ? <ErrorNote error={coupons.error} /> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Live coupons" value={String(totals.live)} />
        <Stat label="Times used" value={String(totals.redemptions)} />
        <Stat label="Discount given" value={npr(totals.given)} />
      </div>
      <DataTable columns={columns} data={items} isLoading={coupons.isLoading} emptyMessage="No coupons yet." onRowClick={(c) => setEditing(c)} />
      {editing !== undefined && <CouponDialog key={editing?.coupon_id ?? "new"} coupon={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <span className="text-xs text-[var(--color-ink-muted)]">{label}</span>
        <span className="text-xl font-semibold">{value}</span>
      </CardContent>
    </Card>
  )
}

const selectClass = "h-9 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"

/** Turns what staff typed into the request, or the first problem in plain words. */
function buildInput(f: FormValues): CouponInput | string {
  const percent = f.kind === "PERCENT" ? parsePercent(f.percent) : null
  if (f.kind === "PERCENT" && percent === null) return "Enter a percentage between 0.01 and 100"
  const amount = f.kind === "FIXED" ? parseRupees(f.amount) : null
  if (f.kind === "FIXED" && (amount === null || amount < 1)) return "Enter the amount to take off, in rupees"
  const cap = f.kind === "PERCENT" && f.cap.trim() ? parseRupees(f.cap) : null
  if (f.kind === "PERCENT" && f.cap.trim() && (cap === null || cap < 1)) return "The maximum discount must be an amount in rupees"
  const min = f.minOrder.trim() ? parseRupees(f.minOrder) : 0
  if (min === null) return "The minimum order must be an amount in rupees"
  if (!f.from || !f.to) return "Choose when the coupon starts and ends"
  if (new Date(f.to) <= new Date(f.from)) return "The end must be after the start"
  const limit = (text: string) => (text.trim() ? Number(text) : null)
  const global = limit(f.globalLimit)
  const perCustomer = limit(f.perCustomerLimit)
  for (const n of [global, perCustomer]) if (n !== null && (!Number.isInteger(n) || n < 1)) return "Limits are whole numbers of at least 1"
  if (f.scope !== "ALL" && f.scopeIds.length === 0) return `Choose at least one ${f.scope === "CATEGORY" ? "category" : "product"}`
  return {
    code: f.code.trim().toUpperCase(), kind: f.kind, percent_bp: percent, amount_minor: amount, max_discount_minor: cap, min_order_minor: min,
    valid_from: toInstant(f.from), valid_to: toInstant(f.to), scope: f.scope, scope_ids: f.scope === "ALL" ? [] : f.scopeIds,
    global_limit: global, per_customer_limit: perCustomer, status: f.status,
  }
}

interface FormValues {
  code: string; kind: CouponKind; percent: string; amount: string; cap: string; minOrder: string; from: string; to: string
  scope: CouponScope; scopeIds: string[]; globalLimit: string; perCustomerLimit: string; status: "ACTIVE" | "DISABLED"
}

const rupees = (minor: number | null | undefined) => (minor == null ? "" : String(minor / 100))

function initial(c: Coupon | null): FormValues {
  if (!c) {
    const start = new Date()
    start.setMinutes(0, 0, 0)
    return {
      code: "", kind: "PERCENT", percent: "10", amount: "", cap: "", minOrder: "", from: toLocalInput(start.toISOString()),
      to: toLocalInput(new Date(start.getTime() + 30 * 86_400_000).toISOString()), scope: "ALL", scopeIds: [], globalLimit: "", perCustomerLimit: "1", status: "ACTIVE",
    }
  }
  return {
    code: c.code, kind: c.kind, percent: percentText(c.percent_bp), amount: rupees(c.amount_minor), cap: rupees(c.max_discount_minor),
    minOrder: c.min_order_minor ? rupees(c.min_order_minor) : "", from: toLocalInput(c.valid_from), to: toLocalInput(c.valid_to), scope: c.scope, scopeIds: c.scope_ids,
    globalLimit: c.global_limit == null ? "" : String(c.global_limit), perCustomerLimit: c.per_customer_limit == null ? "" : String(c.per_customer_limit), status: c.status,
  }
}

function CouponDialog({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const canWrite = usePermission("promotions:write")
  const create = useCreateCoupon()
  const edit = useEditCoupon()
  const setStatus = useSetCouponStatus()
  const [key] = React.useState(newIdempotencyKey)
  const [f, setF] = React.useState<FormValues>(() => initial(coupon))
  const [problem, setProblem] = React.useState<string | null>(null)
  const set = (patch: Partial<FormValues>) => setF((v) => ({ ...v, ...patch }))
  const used = (coupon?.usage_count ?? 0) > 0
  const error = create.error ?? edit.error ?? setStatus.error

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = buildInput(f)
    if (typeof input === "string") return setProblem(input)
    setProblem(null)
    const done = { onSuccess: () => { toast.success(coupon ? "Coupon saved" : "Coupon created"); onClose() } }
    if (coupon) edit.mutate({ id: coupon.coupon_id, input }, done)
    else create.mutate({ key, input }, done)
  }

  const toggle = () => {
    if (!coupon) return
    setStatus.mutate({ id: coupon.coupon_id, status: coupon.status === "ACTIVE" ? "DISABLED" : "ACTIVE" },
      { onSuccess: () => { toast.success(coupon.status === "ACTIVE" ? "Coupon switched off" : "Coupon switched on"); onClose() } })
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{coupon ? `Coupon ${coupon.code}` : "New coupon"}</DialogTitle>
            <DialogDescription>
              {coupon ? `Used ${coupon.redemptions} times, ${npr(coupon.discount_given_minor)} given.` : "Codes are capital letters, digits, dashes and underscores."}
              {used ? " The discount terms are locked because customers already used it." : ""}
            </DialogDescription>
          </DialogHeader>
          <fieldset disabled={!canWrite} className="grid gap-4 sm:grid-cols-2">
            <Field label="Code"><Input value={f.code} required maxLength={32} disabled={!!coupon} className="font-mono uppercase" onChange={(e) => set({ code: e.target.value })} /></Field>
            <Field label="Type">
              <select className={selectClass} value={f.kind} disabled={used} onChange={(e) => set({ kind: e.target.value as CouponKind })}>
                <option value="PERCENT">Percentage off</option>
                <option value="FIXED">Fixed amount off</option>
              </select>
            </Field>
            {f.kind === "PERCENT" ? (
              <>
                <Field label="Percentage (%)"><Input inputMode="decimal" value={f.percent} disabled={used} onChange={(e) => set({ percent: e.target.value })} /></Field>
                <Field label="Largest discount (Rs, optional)"><Input inputMode="decimal" value={f.cap} disabled={used} placeholder="No cap" onChange={(e) => set({ cap: e.target.value })} /></Field>
              </>
            ) : (
              <Field label="Amount off (Rs)"><Input inputMode="decimal" value={f.amount} disabled={used} onChange={(e) => set({ amount: e.target.value })} /></Field>
            )}
            <Field label="Smallest order (Rs, optional)"><Input inputMode="decimal" value={f.minOrder} placeholder="No minimum" onChange={(e) => set({ minOrder: e.target.value })} /></Field>
            <Field label="Starts"><Input type="datetime-local" value={f.from} required onChange={(e) => set({ from: e.target.value })} /></Field>
            <Field label="Ends"><Input type="datetime-local" value={f.to} required onChange={(e) => set({ to: e.target.value })} /></Field>
            <Field label="Total uses allowed (optional)" hint={used ? `Not below the ${coupon?.usage_count} already used.` : undefined}>
              <Input inputMode="numeric" value={f.globalLimit} placeholder="Unlimited" onChange={(e) => set({ globalLimit: e.target.value })} />
            </Field>
            <Field label="Uses per customer (optional)"><Input inputMode="numeric" value={f.perCustomerLimit} placeholder="Unlimited" onChange={(e) => set({ perCustomerLimit: e.target.value })} /></Field>
            <Field label="Applies to">
              <select className={selectClass} value={f.scope} onChange={(e) => set({ scope: e.target.value as CouponScope, scopeIds: [] })}>
                <option value="ALL">Everything in the cart</option>
                <option value="CATEGORY">Chosen categories (and their sub-categories)</option>
                <option value="PRODUCT">Chosen products</option>
              </select>
            </Field>
            {f.scope !== "ALL" && (
              <div className="sm:col-span-2">
                <ScopePicker scope={f.scope} value={f.scopeIds} onChange={(scopeIds) => set({ scopeIds })} />
              </div>
            )}
          </fieldset>
          {problem ? <ErrorNote error={problem} /> : null}
          {error ? <ErrorNote error={errorText(error)} /> : null}
          <DialogFooter className="gap-2">
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            {canWrite && coupon && (
              <Button type="button" variant={coupon.status === "ACTIVE" ? "destructive" : "secondary"} disabled={setStatus.isPending} onClick={toggle}>
                {coupon.status === "ACTIVE" ? "Switch off" : "Switch on"}
              </Button>
            )}
            {canWrite && <Button type="submit" disabled={create.isPending || edit.isPending}>{coupon ? "Save" : "Create"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** The categories or products a coupon is limited to. Products shown are the latest 50 published ones. */
function ScopePicker({ scope, value, onChange }: { scope: CouponScope; value: string[]; onChange: (ids: string[]) => void }) {
  const categories = categoriesApi.useList()
  const products = useProducts("PUBLISHED")
  const options = React.useMemo(
    () => scope === "CATEGORY"
      ? flattenTree(categories.data ?? []).map((n) => ({ id: n.category.id, label: n.category.name, depth: n.depth }))
      : (products.data?.pages.flatMap((p) => p.items) ?? []).map((p) => ({ id: p.id, label: p.name, depth: 0 })),
    [scope, categories.data, products.data],
  )
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium text-[var(--color-ink)]">{scope === "CATEGORY" ? "Categories" : "Products"} ({value.length} chosen)</span>
      <div className="max-h-48 overflow-y-auto rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
        {options.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">{categories.isLoading || products.isLoading ? "Loading…" : "Nothing to choose from."}</p>}
        {options.map((o) => (
          <label key={o.id} className="flex items-center gap-2 py-0.5 text-sm" style={{ paddingLeft: o.depth * 16 }}>
            <input type="checkbox" className="size-4" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
            {o.label}
          </label>
        ))}
      </div>
    </div>
  )
}
