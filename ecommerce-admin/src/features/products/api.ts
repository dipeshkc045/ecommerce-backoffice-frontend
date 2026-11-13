import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, newIdempotencyKey } from "@/lib/api-client"

// ── Shapes of /admin/v1/products, /admin/v1/skus/{id}/price and /stock (ecommerce-platform #35, #37) ──────────────

export type ProductStatus = "DRAFT" | "PUBLISHED" | "UNPUBLISHED" | "ARCHIVED"

export interface Sku {
  sku_id: string
  sku_code: string
  option_label: string
  active: boolean
}

export interface Product {
  id: string
  name: string
  description: string | null
  status: ProductStatus
  version: number
  skus: Sku[]
}

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
}

export interface PriceChange {
  change_id: string
  sku_id: string
  current_minor: number | null
  proposed_minor: number
  status: string
  requested_by: string
  requested_at: string
  decided_by: string | null
  decided_at: string | null
}

export interface SkuPrice {
  sku_id: string
  currency: string
  amount_minor: number | null
  pending_change: PriceChange | null
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

export function useProducts(status: string) {
  return useQuery({
    queryKey: keys.list(status),
    queryFn: () => apiClient.get<ProductPage>(`/admin/v1/products?limit=100${status ? `&status=${status}` : ""}`),
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

export const usePublishProduct = () =>
  useProductChange<"publish" | "unpublish">((p, action) => apiClient.post<Product>(`/admin/v1/products/${p.id}/${action}`, {}, ifMatch(p.version)))

export function useSkuPrice(skuId: string) {
  return useQuery({ queryKey: keys.price(skuId), queryFn: () => apiClient.get<SkuPrice>(`/admin/v1/skus/${skuId}/price`) })
}

export function useSetPrice(skuId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (amountMinor: number) =>
      apiClient.put<SetPriceResult>(`/admin/v1/skus/${skuId}/price`, { amount_minor: amountMinor, currency: "NPR" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.price(skuId) })
      qc.invalidateQueries({ queryKey: ["price-changes"] })
    },
  })
}

export function useSkuStock(skuId: string) {
  return useQuery({ queryKey: keys.stock(skuId), queryFn: () => apiClient.get<SkuStock>(`/admin/v1/skus/${skuId}/stock`) })
}

export function useReceiveStock(skuId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ quantity, note }: { quantity: number; note: string }) =>
      apiClient.post<SkuStock>(`/admin/v1/skus/${skuId}/stock/receipts`, { quantity, note: note || null },
        { headers: { "Idempotency-Key": newIdempotencyKey() } }),
    onSuccess: (stock) => qc.setQueryData(keys.stock(skuId), stock),
  })
}

export function useAdjustStock(skuId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ delta, reason, note }: { delta: number; reason: AdjustReason; note: string }) =>
      apiClient.post<SkuStock>(`/admin/v1/skus/${skuId}/stock/adjustments`, { delta, reason, note: note || null },
        { headers: { "Idempotency-Key": newIdempotencyKey() } }),
    onSuccess: (stock) => qc.setQueryData(keys.stock(skuId), stock),
  })
}
