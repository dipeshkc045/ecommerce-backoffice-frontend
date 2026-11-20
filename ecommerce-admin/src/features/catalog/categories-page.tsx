import * as React from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ErrorNote, Field, Loading, PageHeader, selectClass } from "@/components/shared/page"
import { RequirePermission, usePermission } from "@/hooks/use-auth"
import { ApiError, errorText, newIdempotencyKey } from "@/lib/api-client"
import { CheckField } from "./form-bits"
import {
  attributesApi, categoriesApi, cleanTranslations, descendantsOf, flattenTree, suggestSlug,
  type AttributeRef, type Category,
} from "./api"

/** The category tree. Staff rename, reorder, hide and attach attributes; products inherit the required ones. */
export function CategoriesPage() {
  const categories = categoriesApi.useList()
  const attributes = attributesApi.useList()
  const canWrite = usePermission("catalog:write")
  // undefined: closed. null: a new top-level category. A category: edit it. {parent}: a new child of it.
  const [editing, setEditing] = React.useState<Category | { parentId: string | null } | undefined>(undefined)

  const rows = React.useMemo(() => flattenTree(categories.data ?? []), [categories.data])
  const attributeName = (id: string) => attributes.data?.find((a) => a.id === id)?.label ?? "…"

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Categories"
        description="Where products are found on the storefront. A category's required attributes apply to everything below it."
        actions={
          <RequirePermission permission="catalog:write">
            <Button onClick={() => setEditing({ parentId: null })}>
              <Plus /> New category
            </Button>
          </RequirePermission>
        }
      />
      {categories.isLoading && <Loading />}
      {categories.error ? <ErrorNote error={categories.error} /> : null}
      {categories.data && rows.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No categories yet.</p>}
      {rows.length > 0 && (
        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] text-left text-xs font-medium text-[var(--color-ink-muted)]">
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5">नेपाली</th>
                <th className="px-4 py-2.5">Attributes</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ category: c, depth }) => (
                <tr key={c.id} className="border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-surface-subtle)]">
                  <td className="px-4 py-2.5">
                    <button type="button" className="text-left" style={{ paddingLeft: depth * 20 }} onClick={() => setEditing(c)}>
                      <span className="font-medium">{c.name}</span>
                      <span className="ml-2 text-xs text-[var(--color-ink-faint)]">{c.slug}</span>
                      {!c.visible && <Badge variant="warning" className="ml-2">hidden</Badge>}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-[var(--color-ink-muted)]">{c.translations.ne ?? "—"}</td>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-ink-muted)]">
                    {c.attributes.length === 0 ? "—" : c.attributes.map((a) => attributeName(a.attribute_id) + (a.required ? " *" : "")).join(", ")}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    {canWrite && <Button variant="ghost" size="sm" onClick={() => setEditing({ parentId: c.id })}><Plus /> Subcategory</Button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-[var(--color-ink-faint)]">* required before a product in this category can be published</p>
      {editing && (
        <CategoryDialog
          // A new key per opening: reopening starts a fresh form
          key={"id" in editing ? editing.id : `new-${editing.parentId}`}
          target={editing}
          all={categories.data ?? []}
          onClose={() => setEditing(undefined)}
        />
      )}
    </div>
  )
}

function CategoryDialog({ target, all, onClose }: { target: Category | { parentId: string | null }; all: Category[]; onClose: () => void }) {
  const existing = "id" in target ? target : null
  const canWrite = usePermission("catalog:write")
  const attributes = attributesApi.useList()
  const create = categoriesApi.useCreate()
  const edit = categoriesApi.useEdit()
  const [key] = React.useState(newIdempotencyKey) // one key per form: a double submit creates one category

  const [name, setName] = React.useState(existing?.name ?? "")
  const [nameNe, setNameNe] = React.useState(existing?.translations.ne ?? "")
  const [slug, setSlug] = React.useState(existing?.slug ?? "")
  const [slugTouched, setSlugTouched] = React.useState(!!existing)
  const [parentId, setParentId] = React.useState<string>(existing ? (existing.parent_id ?? "") : (target as { parentId: string | null }).parentId ?? "")
  const [position, setPosition] = React.useState(String(existing?.position ?? 0))
  const [visible, setVisible] = React.useState(existing?.visible ?? true)
  const [refs, setRefs] = React.useState<AttributeRef[]>(existing?.attributes ?? [])

  const blocked = existing ? descendantsOf(all, existing.id) : new Set<string>()
  const parentChoices = flattenTree(all).filter((n) => !blocked.has(n.category.id))
  const free = (attributes.data ?? []).filter((a) => !refs.some((r) => r.attribute_id === a.id))
  const pending = create.isPending || edit.isPending
  const error = create.error ?? edit.error

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = {
      parent_id: parentId || null,
      slug,
      name,
      translations: cleanTranslations({ ne: nameNe }),
      position: Number.parseInt(position, 10) || 0,
      visible,
      attributes: refs,
    }
    const done = { onSuccess: () => { toast.success(existing ? "Category saved" : "Category created"); onClose() } }
    if (existing) edit.mutate({ item: existing, input }, done)
    else create.mutate({ key, input }, done)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{existing ? `Edit ${existing.name}` : "New category"}</DialogTitle>
            <DialogDescription>Changes show on the storefront at once.</DialogDescription>
          </DialogHeader>
          <fieldset disabled={!canWrite} className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name (English)">
                <Input value={name} required maxLength={120} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(suggestSlug(e.target.value)) }} />
              </Field>
              <Field label="नाम (Nepali)">
                <Input value={nameNe} maxLength={120} lang="ne" onChange={(e) => setNameNe(e.target.value)} />
              </Field>
              <Field label="Slug" hint="Part of the web address. Lower-case letters, digits, dashes.">
                <Input value={slug} required maxLength={80} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }} />
              </Field>
              <Field label="Position" hint="Lower comes first among siblings.">
                <Input value={position} inputMode="numeric" onChange={(e) => setPosition(e.target.value)} />
              </Field>
            </div>
            <Field label="Parent category">
              <select value={parentId} onChange={(e) => setParentId(e.target.value)} className={selectClass}>
                <option value="">None (top level)</option>
                {parentChoices.map(({ category, depth }) => (
                  <option key={category.id} value={category.id}>{"— ".repeat(depth)}{category.name}</option>
                ))}
              </select>
            </Field>
            <CheckField label="Visible on the storefront" checked={visible} onChange={setVisible} />

            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium">Attributes products here are described by</span>
              {refs.length === 0 && <span className="text-xs text-[var(--color-ink-faint)]">None yet.</span>}
              {refs.map((ref, i) => (
                <div key={ref.attribute_id} className="flex items-center gap-3 text-sm">
                  <span className="flex-1">{attributes.data?.find((a) => a.id === ref.attribute_id)?.label ?? ref.attribute_id}</span>
                  <CheckField label="Required" checked={ref.required} onChange={(v) => setRefs(refs.map((r, j) => (j === i ? { ...r, required: v } : r)))} />
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove attribute" onClick={() => setRefs(refs.filter((_, j) => j !== i))}><Trash2 /></Button>
                </div>
              ))}
              {free.length > 0 && (
                <select aria-label="Add an attribute" className={selectClass + " self-start"} value="" onChange={(e) => e.target.value && setRefs([...refs, { attribute_id: e.target.value, required: false }])}>
                  <option value="">Add an attribute…</option>
                  {free.map((a) => <option key={a.id} value={a.id}>{a.label} ({a.code})</option>)}
                </select>
              )}
            </div>
          </fieldset>
          {error ? <ErrorNote error={friendly(error)} /> : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            {canWrite && <Button type="submit" disabled={pending}>{existing ? "Save" : "Create"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** A stale version (412) is the one error that needs a clearer sentence than the server's. */
function friendly(error: unknown): string {
  return error instanceof ApiError && error.status === 412 ? "Someone else changed this category. It has been reloaded; close this and open it again." : errorText(error)
}
