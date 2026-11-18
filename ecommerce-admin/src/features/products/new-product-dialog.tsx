import * as React from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field } from "@/components/shared/page"
import { newIdempotencyKey } from "@/lib/api-client"
import { useCreateProduct, type Product, type SkuInput } from "./api"
import { SkuRows } from "./sku-rows"

export function NewProductDialog({ onClose, onCreated }: { onClose: () => void; onCreated: (p: Product) => void }) {
  const [key] = React.useState(newIdempotencyKey) // one key per form: a double submit creates one product
  const [name, setName] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [skus, setSkus] = React.useState<SkuInput[]>([{ sku_code: "", option_label: "", active: true }])
  const create = useCreateProduct()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    create.mutate(
      { key, input: { name, description: description || null, skus: skus.filter((s) => s.sku_code?.trim()) } },
      {
        onSuccess: (p) => {
          toast.success(`${p.name} created as a draft`)
          onCreated(p)
        },
      },
    )
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>New product</DialogTitle>
            <DialogDescription>It starts as a draft. Set prices and stock, then publish it.</DialogDescription>
          </DialogHeader>
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
          </Field>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              maxLength={5000}
              className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] p-2 text-sm"
            />
          </Field>
          <SkuRows rows={skus} onChange={setSkus} />
          {create.error ? <ErrorNote error={create.error} /> : null}
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>Create draft</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
