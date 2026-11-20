import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { ErrorNote, Field, PageHeader, selectClass } from "@/components/shared/page"
import { RequirePermission, usePermission } from "@/hooks/use-auth"
import { ApiError, errorText, newIdempotencyKey } from "@/lib/api-client"
import { CheckField, Fixed } from "./form-bits"
import { ATTRIBUTE_TYPES, attributesApi, cleanTranslations, type Attribute, type AttributeOption, type AttributeType } from "./api"

const TYPE_LABEL: Record<AttributeType, string> = {
  STRING: "Text", NUMBER: "Number", BOOLEAN: "Yes / no", ENUM: "One of a list", MULTI_ENUM: "Several of a list",
}

const columns: ColumnDef<Attribute>[] = [
  { accessorKey: "label", header: "Attribute" },
  { accessorKey: "code", header: "Code" },
  { id: "type", header: "Type", cell: ({ row }) => TYPE_LABEL[row.original.type] },
  { id: "options", header: "Choices", cell: ({ row }) => row.original.options.map((o) => o.label).join(", ") || "—" },
  { id: "flags", header: "", cell: ({ row }) => (
    <span className="flex gap-1">
      {row.original.filterable && <Badge variant="accent">filter</Badge>}
      {row.original.searchable && <Badge variant="neutral">search</Badge>}
    </span>
  ) },
]

export function AttributesPage() {
  const attributes = attributesApi.useList()
  const [editing, setEditing] = React.useState<Attribute | null | undefined>(undefined)
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Attributes"
        description="What a product can be described by: colour, size, material… Attach them to categories to ask for them."
        actions={
          <RequirePermission permission="catalog:write">
            <Button onClick={() => setEditing(null)}><Plus /> New attribute</Button>
          </RequirePermission>
        }
      />
      {attributes.error ? <ErrorNote error={attributes.error} /> : null}
      <DataTable columns={columns} data={attributes.data ?? []} isLoading={attributes.isLoading} emptyMessage="No attributes yet." onRowClick={(a) => setEditing(a)} />
      {editing !== undefined && <AttributeDialog key={editing?.id ?? "new"} attribute={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}

function AttributeDialog({ attribute, onClose }: { attribute: Attribute | null; onClose: () => void }) {
  const canWrite = usePermission("catalog:write")
  const create = attributesApi.useCreate()
  const edit = attributesApi.useEdit()
  const [key] = React.useState(newIdempotencyKey)

  const [code, setCode] = React.useState(attribute?.code ?? "")
  const [type, setType] = React.useState<AttributeType>(attribute?.type ?? "STRING")
  const [label, setLabel] = React.useState(attribute?.label ?? "")
  const [labelNe, setLabelNe] = React.useState(attribute?.translations.ne ?? "")
  const [unit, setUnit] = React.useState(attribute?.unit ?? "")
  const [filterable, setFilterable] = React.useState(attribute?.filterable ?? false)
  const [searchable, setSearchable] = React.useState(attribute?.searchable ?? false)
  const [options, setOptions] = React.useState<AttributeOption[]>(attribute?.options ?? [])
  const [maxLength, setMaxLength] = React.useState(attribute?.limits.max_length?.toString() ?? "")
  const [min, setMin] = React.useState(attribute?.limits.min?.toString() ?? "")
  const [max, setMax] = React.useState(attribute?.limits.max?.toString() ?? "")
  const error = create.error ?? edit.error
  const hasOptions = type === "ENUM" || type === "MULTI_ENUM"

  const setOption = (i: number, patch: Partial<AttributeOption>) => setOptions(options.map((o, j) => (j === i ? { ...o, ...patch } : o)))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const limits = type === "STRING" ? { max_length: maxLength ? Number(maxLength) : null }
      : type === "NUMBER" ? { min: min ? Number(min) : null, max: max ? Number(max) : null } : null
    const input = {
      code: code.trim().toLowerCase(), type, label, translations: cleanTranslations({ ne: labelNe }),
      unit: type === "NUMBER" && unit.trim() ? unit.trim() : null,
      filterable, searchable,
      options: hasOptions ? options.map((o) => ({ ...o, code: o.code.trim().toLowerCase(), translations: cleanTranslations(o.translations) })) : [],
      limits,
    }
    const done = { onSuccess: () => { toast.success(attribute ? "Attribute saved" : "Attribute created"); onClose() } }
    if (attribute) edit.mutate({ item: attribute, input }, done)
    else create.mutate({ key, input }, done)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{attribute ? `Edit ${attribute.label}` : "New attribute"}</DialogTitle>
            <DialogDescription>The code and the type are fixed once created, because products already store values by them.</DialogDescription>
          </DialogHeader>
          <fieldset disabled={!canWrite} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Label (English)"><Input value={label} required maxLength={120} onChange={(e) => setLabel(e.target.value)} /></Field>
              <Field label="लेबल (Nepali)"><Input value={labelNe} maxLength={120} lang="ne" onChange={(e) => setLabelNe(e.target.value)} /></Field>
              {attribute ? <Fixed label="Code">{attribute.code}</Fixed> : (
                <Field label="Code" hint="Lower-case, no spaces. Used by products and search."><Input value={code} required maxLength={60} placeholder="colour" onChange={(e) => setCode(e.target.value)} /></Field>
              )}
              {attribute ? <Fixed label="Type">{TYPE_LABEL[attribute.type]}</Fixed> : (
                <Field label="Type">
                  <select value={type} onChange={(e) => setType(e.target.value as AttributeType)} className={selectClass}>
                    {ATTRIBUTE_TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}
                  </select>
                </Field>
              )}
            </div>

            {type === "NUMBER" && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="Unit" hint="kg, cm, litre…"><Input value={unit} maxLength={20} onChange={(e) => setUnit(e.target.value)} /></Field>
                <Field label="Smallest value"><Input value={min} inputMode="decimal" onChange={(e) => setMin(e.target.value)} /></Field>
                <Field label="Largest value"><Input value={max} inputMode="decimal" onChange={(e) => setMax(e.target.value)} /></Field>
              </div>
            )}
            {type === "STRING" && <Field label="Longest text" hint="Characters. Empty for the default."><Input className="w-40" value={maxLength} inputMode="numeric" onChange={(e) => setMaxLength(e.target.value)} /></Field>}

            {hasOptions && (
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium">Choices</span>
                <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs font-medium text-[var(--color-ink-muted)]"><span>Code</span><span>Label (English)</span><span>लेबल (Nepali)</span><span /></div>
                {options.map((o, i) => (
                  <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-2">
                    <Input aria-label="Choice code" value={o.code} maxLength={60} placeholder="red" onChange={(e) => setOption(i, { code: e.target.value })} />
                    <Input aria-label="Choice label" value={o.label} maxLength={120} placeholder="Red" onChange={(e) => setOption(i, { label: e.target.value })} />
                    <Input aria-label="Choice label in Nepali" lang="ne" value={o.translations.ne ?? ""} maxLength={120} onChange={(e) => setOption(i, { translations: { ...o.translations, ne: e.target.value } })} />
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove choice" onClick={() => setOptions(options.filter((_, j) => j !== i))}><Trash2 /></Button>
                  </div>
                ))}
                <Button type="button" variant="secondary" size="sm" className="self-start" onClick={() => setOptions([...options, { code: "", label: "", translations: {} }])}><Plus /> Add choice</Button>
              </div>
            )}

            <div className="flex gap-6">
              <CheckField label="Filterable" checked={filterable} onChange={setFilterable} hint="Shoppers can narrow search by it." />
              <CheckField label="Searchable" checked={searchable} onChange={setSearchable} hint="Its text is searched." />
            </div>
          </fieldset>
          {error ? <ErrorNote error={error instanceof ApiError && error.status === 412 ? "Someone else changed this attribute. It has been reloaded; close this and open it again." : errorText(error)} /> : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            {canWrite && <Button type="submit" disabled={create.isPending || edit.isPending}>{attribute ? "Save" : "Create"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
