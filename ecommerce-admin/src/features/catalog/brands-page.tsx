import * as React from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DataTable } from "@/components/shared/data-table"
import { ErrorNote, Field, PageHeader } from "@/components/shared/page"
import { RequirePermission, usePermission } from "@/hooks/use-auth"
import { ApiError, errorText, newIdempotencyKey } from "@/lib/api-client"
import { CheckField } from "./form-bits"
import { brandsApi, suggestSlug, type Brand } from "./api"

const columns: ColumnDef<Brand>[] = [
  { accessorKey: "name", header: "Brand" },
  { accessorKey: "slug", header: "Slug" },
  { id: "active", header: "Status", cell: ({ row }) => <Badge variant={row.original.active ? "success" : "neutral"}>{row.original.active ? "active" : "inactive"}</Badge> },
]

export function BrandsPage() {
  const brands = brandsApi.useList()
  const [editing, setEditing] = React.useState<Brand | null | undefined>(undefined) // undefined: closed, null: new
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Brands"
        description="Products can carry one brand. An inactive brand can't be given to more products, but the ones that have it keep it."
        actions={
          <RequirePermission permission="catalog:write">
            <Button onClick={() => setEditing(null)}><Plus /> New brand</Button>
          </RequirePermission>
        }
      />
      {brands.error ? <ErrorNote error={brands.error} /> : null}
      <DataTable columns={columns} data={brands.data ?? []} isLoading={brands.isLoading} emptyMessage="No brands yet." onRowClick={(b) => setEditing(b)} />
      {editing !== undefined && <BrandDialog key={editing?.id ?? "new"} brand={editing} onClose={() => setEditing(undefined)} />}
    </div>
  )
}

function BrandDialog({ brand, onClose }: { brand: Brand | null; onClose: () => void }) {
  const canWrite = usePermission("catalog:write")
  const create = brandsApi.useCreate()
  const edit = brandsApi.useEdit()
  const [key] = React.useState(newIdempotencyKey)
  const [name, setName] = React.useState(brand?.name ?? "")
  const [slug, setSlug] = React.useState(brand?.slug ?? "")
  const [slugTouched, setSlugTouched] = React.useState(!!brand)
  const [active, setActive] = React.useState(brand?.active ?? true)
  const error = create.error ?? edit.error

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const input = { name, slug, active }
    const done = { onSuccess: () => { toast.success(brand ? "Brand saved" : "Brand created"); onClose() } }
    if (brand) edit.mutate({ item: brand, input }, done)
    else create.mutate({ key, input }, done)
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{brand ? `Edit ${brand.name}` : "New brand"}</DialogTitle>
            <DialogDescription>Brand names are shown as written; they are not translated.</DialogDescription>
          </DialogHeader>
          <fieldset disabled={!canWrite} className="flex flex-col gap-4">
            <Field label="Name"><Input value={name} required maxLength={120} onChange={(e) => { setName(e.target.value); if (!slugTouched) setSlug(suggestSlug(e.target.value)) }} /></Field>
            <Field label="Slug"><Input value={slug} required maxLength={80} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true) }} /></Field>
            <CheckField label="Active" checked={active} onChange={setActive} hint="Inactive brands can't be given to more products." />
          </fieldset>
          {error ? <ErrorNote error={error instanceof ApiError && error.status === 412 ? "Someone else changed this brand. It has been reloaded; close this and open it again." : errorText(error)} /> : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            {canWrite && <Button type="submit" disabled={create.isPending || edit.isPending}>{brand ? "Save" : "Create"}</Button>}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
