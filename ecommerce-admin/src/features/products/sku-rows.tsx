import { Trash2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { SkuInput } from "./api"

/** Editable SKU lines. Existing SKUs keep their code (it never changes) and can only be turned off, not removed. */
export function SkuRows({ rows, onChange }: { rows: SkuInput[]; onChange: (rows: SkuInput[]) => void }) {
  const update = (i: number, patch: Partial<SkuInput>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)))
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_1fr_auto_auto] gap-2 text-xs font-medium text-[var(--color-ink-muted)]">
        <span>SKU code</span>
        <span>Option (size, colour…)</span>
        <span>On sale</span>
        <span />
      </div>
      {rows.map((row, i) => (
        <div key={row.sku_id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-2">
          <Input
            value={row.sku_code ?? ""}
            disabled={!!row.sku_id}
            placeholder="TOPI-M"
            aria-label="SKU code"
            onChange={(e) => update(i, { sku_code: e.target.value.toUpperCase() })}
          />
          <Input value={row.option_label} placeholder="Medium" aria-label="Option" onChange={(e) => update(i, { option_label: e.target.value })} />
          <input
            type="checkbox"
            aria-label="On sale"
            className="size-4"
            checked={row.active ?? true}
            onChange={(e) => update(i, { active: e.target.checked })}
          />
          {row.sku_id ? (
            <span className="w-9" />
          ) : (
            <Button type="button" variant="ghost" size="icon" aria-label="Remove line" onClick={() => onChange(rows.filter((_, j) => j !== i))}>
              <Trash2 />
            </Button>
          )}
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => onChange([...rows, { sku_code: "", option_label: "", active: true }])}>
        <Plus /> Add SKU
      </Button>
    </div>
  )
}
