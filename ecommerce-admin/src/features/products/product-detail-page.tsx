import * as React from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ErrorNote, Field, Loading, PageHeader, StatusBadge } from "@/components/shared/page"
import { usePermission } from "@/hooks/use-auth"
import { ApiError, errorText } from "@/lib/api-client"
import { usePublishProduct, useProduct, useUpdateProduct, type Product, type SkuInput } from "./api"
import { SkuRows } from "./sku-rows"
import { SkuPricePanel } from "./sku-price-panel"
import { SkuStockPanel } from "./sku-stock-panel"

export function ProductDetailPage() {
  const { id = "" } = useParams()
  const product = useProduct(id)
  if (product.isLoading) return <Loading />
  if (product.error || !product.data) return <ErrorNote error={product.error ?? "Product not found"} />
  // Re-mount the form when the version changes, so it always edits what is saved
  return <ProductEditor key={`${product.data.id}:${product.data.version}`} product={product.data} />
}

function ProductEditor({ product }: { product: Product }) {
  const canWrite = usePermission("catalog:write")
  const [name, setName] = React.useState(product.name)
  const [description, setDescription] = React.useState(product.description ?? "")
  const [skus, setSkus] = React.useState<SkuInput[]>(product.skus.map((s) => ({ ...s })))
  const update = useUpdateProduct()
  const publish = usePublishProduct()

  const onError = (e: unknown) =>
    toast.error(e instanceof ApiError && e.status === 412 ? "Someone else changed this product. It has been reloaded; please redo your change." : errorText(e))

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    update.mutate(
      { product, vars: { name, description: description || null, skus: skus.filter((s) => s.sku_id || s.sku_code?.trim()) } },
      { onSuccess: () => toast.success("Saved"), onError },
    )
  }

  const toggle = (action: "publish" | "unpublish") =>
    publish.mutate(
      { product, vars: action },
      { onSuccess: (p) => toast.success(p.status === "PUBLISHED" ? "Published: customers can see it now" : "Unpublished"), onError },
    )

  return (
    <div className="flex flex-col gap-5">
      <Link to="/products" className="flex items-center gap-1 text-sm text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]">
        <ArrowLeft className="size-4" /> Products
      </Link>
      <PageHeader
        title={product.name}
        description={`Version ${product.version}`}
        actions={
          <>
            <StatusBadge status={product.status} />
            {canWrite && product.status !== "PUBLISHED" && (
              <Button onClick={() => toggle("publish")} disabled={publish.isPending}>Publish</Button>
            )}
            {canWrite && product.status === "PUBLISHED" && (
              <Button variant="secondary" onClick={() => toggle("unpublish")} disabled={publish.isPending}>Unpublish</Button>
            )}
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>Editing a published product changes the storefront at once. Placed orders keep their own copy.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={save} className="flex flex-col gap-4">
            <fieldset disabled={!canWrite} className="flex flex-col gap-4">
              <Field label="Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} />
              </Field>
              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="rounded-[var(--radius-md)] border border-[var(--color-border-strong)] p-2 text-sm"
                />
              </Field>
              <SkuRows rows={skus} onChange={setSkus} />
            </fieldset>
            {canWrite && (
              <Button type="submit" className="self-start" disabled={update.isPending}>Save changes</Button>
            )}
          </form>
        </CardContent>
      </Card>

      {product.skus.map((sku) => (
        <Card key={sku.sku_id}>
          <CardHeader>
            <CardTitle>
              {sku.sku_code} {sku.option_label && <span className="font-normal text-[var(--color-ink-muted)]">· {sku.option_label}</span>}
            </CardTitle>
            {!sku.active && <CardDescription>Turned off: not for sale.</CardDescription>}
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-2">
            <SkuPricePanel skuId={sku.sku_id} />
            <SkuStockPanel skuId={sku.sku_id} />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
