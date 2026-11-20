import * as React from "react"
import { Input } from "@/components/ui/input"
import { Field, selectClass } from "@/components/shared/page"
import { CheckField } from "@/features/catalog/form-bits"
import {
  attributeRequirements, attributesApi, brandsApi, categoriesApi, flattenTree, type Attribute,
} from "@/features/catalog/api"
import type { AttributeValue, ProductFormState } from "./product-form-state"

/** Brand, categories and the attributes those categories ask for. Read-only without catalog:write. */
export function ClassificationFields({ state, onChange }: { state: ProductFormState; onChange: (next: ProductFormState) => void }) {
  const brands = brandsApi.useList()
  const categories = categoriesApi.useList()
  const attributes = attributesApi.useList()

  const tree = React.useMemo(() => flattenTree(categories.data ?? []), [categories.data])
  const requirements = React.useMemo(() => attributeRequirements(state.categoryIds, categories.data ?? []), [state.categoryIds, categories.data])

  // The attributes to show: those the categories ask for, plus any the product already has a value for
  const shown = (attributes.data ?? [])
    .filter((a) => requirements.has(a.id) || a.code in state.attributes)
    .sort((a, b) => Number(requirements.get(b.id) ?? false) - Number(requirements.get(a.id) ?? false) || a.label.localeCompare(b.label))

  const toggleCategory = (id: string, on: boolean) => {
    const categoryIds = on ? [...state.categoryIds, id] : state.categoryIds.filter((c) => c !== id)
    const primaryCategoryId = on && categoryIds.length === 1 ? id : categoryIds.includes(state.primaryCategoryId) ? state.primaryCategoryId : ""
    onChange({ ...state, categoryIds, primaryCategoryId })
  }
  const setAttribute = (code: string, value: AttributeValue | undefined) => {
    const attributes = { ...state.attributes }
    if (value === undefined) delete attributes[code]
    else attributes[code] = value
    onChange({ ...state, attributes })
  }

  return (
    <div className="flex flex-col gap-5">
      <Field label="Brand">
        <select value={state.brandId} onChange={(e) => onChange({ ...state, brandId: e.target.value })} className={selectClass + " max-w-xs"}>
          <option value="">No brand</option>
          {(brands.data ?? []).filter((b) => b.active || b.id === state.brandId).map((b) => (
            <option key={b.id} value={b.id}>{b.name}{b.active ? "" : " (inactive)"}</option>
          ))}
        </select>
      </Field>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium">Categories</span>
        {tree.length === 0 && <span className="text-xs text-[var(--color-ink-faint)]">No categories yet. Create them under Categories first.</span>}
        <div className="flex max-h-64 flex-col gap-1 overflow-auto rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
          {tree.map(({ category: c, depth }) => {
            const on = state.categoryIds.includes(c.id)
            return (
              <div key={c.id} className="flex items-center gap-3 text-sm" style={{ paddingLeft: depth * 18 }}>
                <CheckField label={c.name} checked={on} onChange={(v) => toggleCategory(c.id, v)} />
                {on && (
                  <label className="ml-auto flex items-center gap-1 text-xs text-[var(--color-ink-muted)]">
                    <input type="radio" name="primary-category" checked={state.primaryCategoryId === c.id} onChange={() => onChange({ ...state, primaryCategoryId: c.id })} />
                    main
                  </label>
                )}
              </div>
            )
          })}
        </div>
        <span className="text-xs text-[var(--color-ink-faint)]">A product needs a main category before it can be published.</span>
      </div>

      {shown.length > 0 && (
        <div className="flex flex-col gap-3">
          <span className="text-sm font-medium">Attributes</span>
          <div className="grid gap-4 sm:grid-cols-2">
            {shown.map((a) => (
              <AttributeField key={a.id} definition={a} required={requirements.get(a.id) ?? false} value={state.attributes[a.code]} onChange={(v) => setAttribute(a.code, v)} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function AttributeField({ definition: d, required, value, onChange }: { definition: Attribute; required: boolean; value: AttributeValue | undefined; onChange: (v: AttributeValue | undefined) => void }) {
  const label = d.label + (d.unit ? ` (${d.unit})` : "") + (required ? " *" : "")
  const choice = (o: Attribute["options"][number]) => o.label + (o.translations.ne ? ` / ${o.translations.ne}` : "")

  switch (d.type) {
    case "BOOLEAN":
      return (
        <div className="flex items-end pb-2">
          <CheckField label={label} checked={value === true} onChange={(v) => onChange(v)} />
        </div>
      )
    case "ENUM":
      return (
        <Field label={label}>
          <select value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value || undefined)} className={selectClass}>
            <option value="">—</option>
            {d.options.map((o) => <option key={o.code} value={o.code}>{choice(o)}</option>)}
          </select>
        </Field>
      )
    case "MULTI_ENUM": {
      const chosen = Array.isArray(value) ? value : []
      return (
        <Field label={label}>
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {d.options.map((o) => (
              <CheckField key={o.code} label={choice(o)} checked={chosen.includes(o.code)}
                onChange={(on) => { const next = on ? [...chosen, o.code] : chosen.filter((c) => c !== o.code); onChange(next.length ? next : undefined) }} />
            ))}
          </div>
        </Field>
      )
    }
    case "NUMBER":
      return (
        <Field label={label} hint={d.limits.min != null || d.limits.max != null ? `Between ${d.limits.min ?? "…"} and ${d.limits.max ?? "…"}` : undefined}>
          <Input value={typeof value === "string" ? value : ""} inputMode="decimal" onChange={(e) => onChange(e.target.value || undefined)} />
        </Field>
      )
    default:
      return (
        <Field label={label}>
          <Input value={typeof value === "string" ? value : ""} maxLength={d.limits.max_length ?? undefined} onChange={(e) => onChange(e.target.value || undefined)} />
        </Field>
      )
  }
}
