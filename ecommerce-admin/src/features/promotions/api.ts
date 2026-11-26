import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

// ── Shapes of /admin/v1/coupons (ecommerce-platform #53) ─────────────────────────────────────────────────────────

export type CouponKind = "PERCENT" | "FIXED"
export type CouponScope = "ALL" | "CATEGORY" | "PRODUCT"
export type CouponStatus = "ACTIVE" | "DISABLED"

export interface Coupon {
  coupon_id: string
  code: string
  kind: CouponKind
  // The platform leaves out fields that are empty, so these are missing (not null) when unset
  /** 1000 = 10 %. Only for PERCENT. */
  percent_bp?: number | null
  /** Paisa. Only for FIXED. */
  amount_minor?: number | null
  max_discount_minor?: number | null
  min_order_minor: number
  valid_from: string
  valid_to: string
  scope: CouponScope
  scope_ids: string[]
  global_limit?: number | null
  per_customer_limit?: number | null
  usage_count: number
  status: CouponStatus
  /** Usage report: how many times it was used and how much it took off, in paisa. */
  redemptions: number
  discount_given_minor: number
}

/** What staff send. A change replaces the whole coupon (PUT); the code cannot change. */
export interface CouponInput {
  code: string
  kind: CouponKind
  percent_bp: number | null
  amount_minor: number | null
  max_discount_minor: number | null
  min_order_minor: number
  valid_from: string
  valid_to: string
  scope: CouponScope
  scope_ids: string[]
  global_limit: number | null
  per_customer_limit: number | null
  status: CouponStatus
}

const listKey = ["coupons"] as const

export function useCoupons() {
  return useQuery({ queryKey: listKey, queryFn: async () => (await apiClient.get<{ items: Coupon[] }>("/admin/v1/coupons")).items })
}

export function useCreateCoupon() {
  const qc = useQueryClient()
  return useMutation({
    // The key is made when the form opens, so a double click or a retry creates one coupon
    mutationFn: ({ key, input }: { key: string; input: CouponInput }) =>
      apiClient.post<Coupon>("/admin/v1/coupons", input, { headers: { "Idempotency-Key": key } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
  })
}

export function useEditCoupon() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CouponInput }) => apiClient.put<Coupon>(`/admin/v1/coupons/${id}`, input),
    onSettled: () => qc.invalidateQueries({ queryKey: listKey }),
  })
}

export function useSetCouponStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: CouponStatus }) => apiClient.put<Coupon>(`/admin/v1/coupons/${id}/status`, { status }),
    onSettled: () => qc.invalidateQueries({ queryKey: listKey }),
  })
}

// ── Form helpers ─────────────────────────────────────────────────────────────────────────────────────────────────

/** "10" or "12.5" typed as a percentage → basis points (1000, 1250). Null when it is not a valid percentage. */
export function parsePercent(text: string): number | null {
  const cleaned = text.trim().replace(/%$/, "")
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const bp = Math.round(Number(cleaned) * 100)
  return bp >= 1 && bp <= 10_000 ? bp : null
}

export const percentText = (bp: number | null | undefined) => (bp == null ? "" : String(bp / 100))

/** A `datetime-local` value ("2026-12-01T09:00", the browser's own time zone) → an ISO instant. */
export const toInstant = (local: string) => (local ? new Date(local).toISOString() : "")

/** An ISO instant → a `datetime-local` value in the browser's time zone. */
export function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return ""
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export type CouponState = "disabled" | "scheduled" | "expired" | "used up" | "live"

/** What customers meet today: a coupon can be active yet not started, over, or out of uses. */
export function couponState(c: Coupon, now = new Date()): CouponState {
  if (c.status === "DISABLED") return "disabled"
  if (now < new Date(c.valid_from)) return "scheduled"
  if (now >= new Date(c.valid_to)) return "expired"
  if (c.global_limit != null && c.usage_count >= c.global_limit) return "used up"
  return "live"
}
