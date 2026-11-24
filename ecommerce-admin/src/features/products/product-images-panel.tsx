import * as React from "react"
import { ArrowLeft, ArrowRight, ImagePlus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { usePermission } from "@/hooks/use-auth"
import { ApiError, errorText, newIdempotencyKey } from "@/lib/api-client"
import { IMAGE_LIMITS, useSetImages, useUploadImage, type Product, type ProductImage } from "./api"

/** An image as edited here: saved ones come from the product, new ones from an upload. */
interface Row {
  assetId: string
  src: string | null
  en: string
  ne: string
}

const rowsOf = (images: ProductImage[] | undefined): Row[] =>
  (images ?? []).map((i) => ({ assetId: i.asset_id, src: i.src ?? null, en: i.alt?.en ?? "", ne: i.alt?.ne ?? "" }))

const altOf = (row: Row) => {
  const alt: Record<string, string> = {}
  if (row.en.trim()) alt.en = row.en.trim()
  if (row.ne.trim()) alt.ne = row.ne.trim()
  return alt
}

/** Why a picked file cannot be uploaded, or null. The platform checks again; this only saves a wasted upload. */
function localProblem(file: File): string | null {
  if (!IMAGE_LIMITS.types.includes(file.type)) return `${file.name}: use a JPEG, PNG or WebP image`
  if (file.size > IMAGE_LIMITS.maxBytes) return `${file.name}: images can be at most 10 MB`
  return null
}

/**
 * Product images (ecommerce-platform #34): upload, order, alt text in English and Nepali. Changes are local until
 * "Save images", which sends the whole list with the product's version; the first image is the main one.
 */
export function ProductImagesPanel({ product }: { product: Product }) {
  const canWrite = usePermission("catalog:write")
  const initial = React.useMemo(() => rowsOf(product.images), [product.images])
  const [rows, setRows] = React.useState<Row[]>(initial)
  const [uploading, setUploading] = React.useState(0)
  const upload = useUploadImage()
  const save = useSetImages()
  const input = React.useRef<HTMLInputElement>(null)
  const dirty = JSON.stringify(rows) !== JSON.stringify(initial)
  const full = rows.length >= IMAGE_LIMITS.maxImages

  const pick = async (files: FileList | null) => {
    if (!files) return
    const room = IMAGE_LIMITS.maxImages - rows.length
    const chosen = Array.from(files)
    if (chosen.length > room) toast.error(`A product can have at most ${IMAGE_LIMITS.maxImages} images; only the first ${room} were added`)
    for (const file of chosen.slice(0, Math.max(room, 0))) {
      const problem = localProblem(file)
      if (problem) {
        toast.error(problem)
        continue
      }
      setUploading((n) => n + 1)
      try {
        const uploaded = await upload.mutateAsync({ key: newIdempotencyKey(), file })
        setRows((current) =>
          current.length >= IMAGE_LIMITS.maxImages ? current : [...current, { assetId: uploaded.id, src: uploaded.src, en: "", ne: "" }],
        )
      } catch (e) {
        toast.error(`${file.name}: ${errorText(e)}`)
      } finally {
        setUploading((n) => n - 1)
      }
    }
    if (input.current) input.current.value = ""
  }

  const move = (index: number, by: number) =>
    setRows((current) => {
      const next = [...current]
      const [row] = next.splice(index, 1)
      next.splice(index + by, 0, row)
      return next
    })

  const change = (index: number, patch: Partial<Row>) => setRows((current) => current.map((r, i) => (i === index ? { ...r, ...patch } : r)))

  const submit = () =>
    save.mutate(
      { product, vars: rows.map((r) => ({ asset_id: r.assetId, alt: altOf(r) })) },
      {
        onSuccess: () => toast.success("Images saved"),
        onError: (e) =>
          toast.error(e instanceof ApiError && e.status === 412 ? "Someone else changed this product. It has been reloaded; please redo your change." : errorText(e)),
      },
    )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Images</CardTitle>
        <CardDescription>
          Up to {IMAGE_LIMITS.maxImages} JPEG, PNG or WebP images, at most 10 MB each. The first is the main image. Alt text describes the image for
          people who cannot see it; without it the product name is used.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {rows.length === 0 && <p className="text-sm text-[var(--color-ink-muted)]">No images yet.</p>}
        <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {rows.map((row, index) => (
            <li key={row.assetId} className="flex flex-col gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius-sm)] bg-[var(--color-surface-subtle)]">
                {row.src ? (
                  <img src={row.src} alt={row.en || product.name} className="size-full object-contain" loading="lazy" />
                ) : (
                  <span className="flex size-full items-center justify-center text-xs text-[var(--color-ink-muted)]">Image not found</span>
                )}
                {index === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-[var(--color-ink)] px-1.5 py-0.5 text-[10px] font-medium text-white">Main</span>
                )}
              </div>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-[var(--color-ink-muted)]">Alt text (English)</span>
                <Input value={row.en} maxLength={250} disabled={!canWrite} onChange={(e) => change(index, { en: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1 text-xs">
                <span className="text-[var(--color-ink-muted)]">Alt text (Nepali)</span>
                <Input value={row.ne} lang="ne" maxLength={250} disabled={!canWrite} onChange={(e) => change(index, { ne: e.target.value })} />
              </label>
              {canWrite && (
                <div className="flex items-center gap-1">
                  <Button type="button" variant="ghost" size="icon" aria-label="Move earlier" disabled={index === 0} onClick={() => move(index, -1)}>
                    <ArrowLeft className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Move later" disabled={index === rows.length - 1} onClick={() => move(index, 1)}>
                    <ArrowRight className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" aria-label="Remove image" className="ml-auto"
                    onClick={() => setRows((current) => current.filter((_, i) => i !== index))}>
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ol>
        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <input ref={input} type="file" accept={IMAGE_LIMITS.types.join(",")} multiple hidden onChange={(e) => pick(e.target.files)}
              aria-label="Choose images" />
            <Button type="button" variant="secondary" disabled={full || uploading > 0} onClick={() => input.current?.click()}>
              <ImagePlus className="size-4" /> {uploading > 0 ? `Uploading ${uploading}…` : "Add images"}
            </Button>
            <Button type="button" disabled={!dirty || uploading > 0 || save.isPending} onClick={submit}>Save images</Button>
            {dirty && <span className="text-xs text-[var(--color-warning)]">Unsaved image changes</span>}
            {rows.some((r) => r.ne.trim() && !r.en.trim()) && (
              <span className="text-xs text-[var(--color-danger)]">Nepali alt text needs English alt text too</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
