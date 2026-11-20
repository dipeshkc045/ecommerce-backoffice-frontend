import * as React from "react"
import { Field } from "@/components/shared/page"

/** A labelled checkbox. */
export function CheckField({ label, checked, onChange, hint, disabled }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string; disabled?: boolean }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-0.5 size-4" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      <span>
        <span className="font-medium text-[var(--color-ink)]">{label}</span>
        {hint && <span className="block text-xs text-[var(--color-ink-faint)]">{hint}</span>}
      </span>
    </label>
  )
}

/** A read-only row of text, for values that cannot change once created. */
export function Fixed({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Field label={label}>
      <div className="flex h-9 items-center rounded-[var(--radius-md)] bg-[var(--color-surface-subtle)] px-3 text-sm text-[var(--color-ink-muted)]">{children}</div>
    </Field>
  )
}
