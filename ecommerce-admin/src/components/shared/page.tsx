import * as React from "react"
import { AlertTriangle, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { errorText } from "@/lib/api-client"

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold text-[var(--color-ink)]">{title}</h1>
        {description && <p className="text-sm text-[var(--color-ink-muted)]">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-[var(--color-ink-muted)]">
      <Loader2 className="size-4 animate-spin" /> Loading…
    </div>
  )
}

export function ErrorNote({ error }: { error: unknown }) {
  return (
    <div role="alert" className="flex items-start gap-2 rounded-[var(--radius-md)] border border-[var(--color-danger)] bg-[var(--color-danger-subtle)] p-3 text-sm text-[var(--color-danger)]">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" />
      <span>{errorText(error)}</span>
    </div>
  )
}

const STATUS_VARIANT: Record<string, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  DRAFT: "neutral",
  PUBLISHED: "success",
  UNPUBLISHED: "warning",
  ARCHIVED: "neutral",
  PENDING_PAYMENT: "warning",
  CONFIRMED: "accent",
  PROCESSING: "accent",
  SHIPPED: "accent",
  DELIVERED: "success",
  COMPLETED: "success",
  CANCELLED: "danger",
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUPERSEDED: "neutral",
}

export function StatusBadge({ status }: { status: string }) {
  return <Badge variant={STATUS_VARIANT[status] ?? "neutral"}>{status.replace(/_/g, " ").toLowerCase()}</Badge>
}

/** A row of filter buttons, e.g. order statuses. */
export function FilterTabs<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={
            "rounded-[var(--radius-sm)] px-3 py-1 text-xs font-medium " +
            (o.value === value ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]" : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]")
          }
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="font-medium text-[var(--color-ink)]">{label}</span>
      {children}
      {hint && <span className="text-xs text-[var(--color-ink-faint)]">{hint}</span>}
    </label>
  )
}

export const selectClass =
  "h-9 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-white px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
