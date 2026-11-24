import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

// ── Shapes of /admin/v1/products, /admin/v1/skus/{id}/price and /stock (ecommerce-platform #35, #37) ──────────────

export type ProductStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED"

export interface Sku {
  sku_id: string
  sku_code: string
  option_label: string
  active: boolean
}

/** Text in another language: either part may be missing. */
export interface Translation {
  name?: string | null
  description?: string | null
}

export interface Product {
  id: string
  name: string
  description: string | null
  translations?: Record<string, Translation>
  status: ProductStatus
  version: number
  brand_id?: string | null
  primary_category_id?: string | null
  category_ids?: string[]
  /** Values by attribute code: text, number, true/false, or a list of choice codes. */
  attributes?: Record<string, unknown>
  skus: Sku[]
  /** In display order; the first is the main image (ecommerce-platform #34). */
  images?: ProductImage[]
}

/** One `<source>` of a `<picture>`: a format and a ready srcset. */
export interface ImageSource {
  type: string
  srcset: string
}

/** An image on a product. `src` and size are missing when the image can no longer be found. */
export interface ProductImage {
  asset_id: string
  role: "MAIN" | "GALLERY"
  /** Alt text by locale (en, ne). */
  alt: Record<string, string>
  width?: number | null
  height?: number | null
  src?: string | null
  sources?: ImageSource[]
}

/** An uploaded image, before it is put on a product. */
export interface UploadedImage {
  id: string
  mime_type: string
  width: number
  height: number
  byte_size: number
  src: string
  sources: ImageSource[]
}

export interface ImageInput {
  asset_id: string
  alt?: Record<string, string>
}

/** What the platform accepts (POST /admin/v1/media); checked here too, so a wrong file fails at once. */
export const IMAGE_LIMITS = { maxBytes: 10 * 1024 * 1024, maxImages: 8, types: ["image/jpeg", "image/png", "image/webp"] }

export interface ProductPage {
  items: Product[]
  next_cursor: string | null
  has_more: boolean
}

/** One SKU line in a create or edit. No sku_id means a new SKU. */
export interface SkuInput {
  sku_id?: string
  sku_code?: string
  option_label: string
  active?: boolean
}

export interface ProductInput {
  name: string
  description: string | null
  skus: SkuInput[]
  // A change replaces the whole product (PUT), so an edit sends all of these
  translations?: Record<string, Translation>
  brand_id?: string | null
  primary_category_id?: string | null
  category_ids?: string[]
  attributes?: Record<string, unknown>
}

export interface PriceChange {
  change_id: string
  sku_id: string
  /** REGULAR (the everyday price) or SALE (a lower price between two dates) */
  kind?: "REGULAR" | "SALE"
  current_minor: number | null
  proposed_minor: number
  starts_at?: string | null
  ends_at?: string | null
  status: string
  requested_by: string
  requested_at: string
  decided_by: string | null
  decided_at: string | null
}

/** One row of a SKU's price timeline: a regular price, or a sale on top of it. Rows are never edited, only ended. */
export interface PriceRow {
  price_id: string
  kind: "REGULAR" | "SALE"
  amount_minor: number
  valid_from: string
  valid_to?: string | null
}

export interface SkuPrice {
  sku_id: string
  currency: string
  price_list?: string
  amount_minor: number | null
  /** What customers pay right now if a sale is running (the regular price is then shown struck through) */
  sale_minor?: number | null
  schedule?: PriceRow[]
  pending_change: PriceChange | null
  pending_changes?: PriceChange[]
}

export interface SetPriceResult {
  result: "APPLIED" | "UNCHANGED" | "AWAITING_APPROVAL"
  amount_minor: number | null
  pending_change: PriceChange | null
}

export interface StockLevel {
  location_id: string
  on_hand: number
  reserved: number
  safety_stock: number
  available: number
}

export interface StockMovement {
  type: string
  delta_on_hand: number
  delta_reserved: number
  reason: string | null
}

export interface SkuStock {
  sku_id: string
  available: number
  locations: StockLevel[]
  recent_movements: StockMovement[]
}

export const ADJUST_REASONS = ["COUNT_CORRECTION", "DAMAGED", "LOST", "FOUND", "RETURNED_TO_SUPPLIER", "OTHER"] as const
export type AdjustReason = (typeof ADJUST_REASONS)[number]

const keys = {
  list: (status: string) => ["products", "list", status] as const,
  one: (id: string) => ["products", "one", id] as const,
  price: (sku: string) => ["skus", sku, "price"] as const,
  stock: (sku: string) => ["skus", sku, "stock"] as const,
}

const ifMatch = (version: number) => ({ headers: { "If-Match": `"${version}"` } })

/** Pages of 50, newest first; `fetchNextPage` follows the server's cursor. */
export function useProducts(status: string) {
  return useInfiniteQuery({
    queryKey: keys.list(status),
    initialPageParam: "",
    queryFn: ({ pageParam }) =>
      apiClient.get<ProductPage>(`/admin/v1/products?limit=50${status ? `&status=${status}` : ""}${pageParam ? `&cursor=${encodeURIComponent(pageParam)}` : ""}`),
    getNextPageParam: (last) => (last.has_more && last.next_cursor ? last.next_cursor : undefined),
  })
}

export function useProduct(id: string) {
  return useQuery({ queryKey: keys.one(id), queryFn: () => apiClient.get<Product>(`/admin/v1/products/${id}`) })
}

export function useCreateProduct() {
  const qc = useQueryClient()
  return useMutation({
    // The key is made by the caller when the form opens, so a double click or a retry creates one product
    mutationFn: ({ key, input }: { key: string; input: ProductInput }) =>
      apiClient.post<Product>("/admin/v1/products", input, { headers: { "Idempotency-Key": key } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", "list"] }),
  })
}

function useProductChange<V>(fn: (p: Product, vars: V) => Promise<Product>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ product, vars }: { product: Product; vars: V }) => fn(product, vars),
    onSuccess: (saved) => {
      qc.setQueryData(keys.one(saved.id), saved)
      qc.invalidateQueries({ queryKey: ["products", "list"] })
    },
    // A stale version (412) means someone else changed it: reload so the next attempt starts from their version
    onError: (_e, { product }) => qc.invalidateQueries({ queryKey: keys.one(product.id) }),
  })
}

export const useUpdateProduct = () =>
  useProductChange<ProductInput>((p, input) => apiClient.put<Product>(`/admin/v1/products/${p.id}`, input, ifMatch(p.version)))

/** Replaces the product's images in the order given (PUT /admin/v1/products/{id}/images). */
export const useSetImages = () =>
  useProductChange<ImageInput[]>((p, images) => apiClient.put<Product>(`/admin/v1/products/${p.id}/images`, { images }, ifMatch(p.version)))

/** Uploads one file. Each file gets its own key, made when it is picked, so a retry never stores it twice. */
export function useUploadImage() {
  return useMutation({
    mutationFn: ({ key, file }: { key: string; file: File }) => {
      const form = new FormData()
      form.append("file", file)
      return apiClient.post<UploadedImage>("/admin/v1/media", form, { headers: { "Idempotency-Key": key } })
    },
  })
}

export const usePublishProduct = () =>
  useProductChange<"publish" | "unpublish">((p, action) => apiClient.post<Product>(`/admin/v1/products/${p.id}/${action}`, {}, ifMatch(p.version)))

export function useSkuPrice(skuId: string) {
  return useQuery({ queryKey: keys.price(skuId), queryFn: () => apiClient.get<SkuPrice>(`/admin/v1/skus/${skuId}/price`) })
}

function usePriceMutation<V, R>(skuId: string, fn: (vars: V) => Promise<R>) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.price(skuId) })
      qc.invalidateQueries({ queryKey: ["price-changes"] })
    },
  })
}

/** Sets the regular price, now or from `startsAt` (an ISO time). More than ±20% waits for a second person. */
export function useSetPrice(skuId: string) {
  return usePriceMutation(skuId, ({ amountMinor, startsAt }: { amountMinor: number; startsAt?: string }) =>
    apiClient.put<SetPriceResult>(`/admin/v1/skus/${skuId}/price`, { amount_minor: amountMinor, currency: "NPR", starts_at: startsAt ?? null }))
}

/** A sale: a lower price from `startsAt` (default now) until `endsAt`, at most a year. The key is made per form. */
export function useAddSale(skuId: string) {
  return usePriceMutation(skuId, ({ key, amountMinor, startsAt, endsAt }: { key: string; amountMinor: number; startsAt?: string; endsAt: string }) =>
    apiClient.post<SetPriceResult>(`/admin/v1/skus/${skuId}/sales`,
      { amount_minor: amountMinor, currency: "NPR", starts_at: startsAt ?? null, ends_at: endsAt }, { headers: { "Idempotency-Key": key } }))
}

/** Cancels a scheduled price or sale; a running sale ends now. */
export function useCancelPrice(skuId: string) {
  return usePriceMutation(skuId, (priceId: string) => apiClient.delete<void>(`/admin/v1/skus/${skuId}/prices/${priceId}`))
}

export function useSkuStock(skuId: string) {
  return useQuery({ queryKey: keys.stock(skuId), queryFn: () => apiClient.get<SkuStock>(`/admin/v1/skus/${skuId}/stock`) })
}

export function useReceiveStock(skuId: string) {
  const qc = useQueryClient()
  return useMutation({
    // The key comes from the caller and stays the same when the user retries after an error, so a delivery whose
    // response was lost is not counted twice
    mutationFn: ({ key, quantity, note }: { key: string; quantity: number; note: string }) =>
      apiClient.post<SkuStock>(`/admin/v1/skus/${skuId}/stock/receipts`, { quantity, note: note || null },
        { headers: { "Idempotency-Key": key } }),
    onSuccess: (stock) => qc.setQueryData(keys.stock(skuId), stock),
  })
}

export function useAdjustStock(skuId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ key, delta, reason, note }: { key: string; delta: number; reason: AdjustReason; note: string }) =>
      apiClient.post<SkuStock>(`/admin/v1/skus/${skuId}/stock/adjustments`, { delta, reason, note: note || null },
        { headers: { "Idempotency-Key": key } }),
    onSuccess: (stock) => qc.setQueryData(keys.stock(skuId), stock),
  })
}
