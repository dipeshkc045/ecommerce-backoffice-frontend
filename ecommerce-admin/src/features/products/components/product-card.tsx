import React from "react"
import { Edit2, Trash2 } from "lucide-react"
import type { Product, ProductIcon } from "../types"

export interface ProductCardProps {
  product?: Partial<Omit<Product, "price">> & {
    price?: number | ""
    description?: string
  }
  mode?: "preview" | "grid"
  onEdit?: () => void
  onDelete?: () => void
  onAddToCart?: () => void
  canEdit?: boolean
}

export const ICONS: Record<string, React.ReactNode> = {
  headphones: (
    <>
      <path d="M4 13v-1a8 8 0 0116 0v1" />
      <rect x="2.5" y="13" width="5" height="8" rx="2" />
      <rect x="16.5" y="13" width="5" height="8" rx="2" />
    </>
  ),
  vrheadset: (
    <>
      <rect x="2" y="7" width="20" height="10" rx="4" />
      <circle cx="8.5" cy="12" r="2.4" />
      <circle cx="15.5" cy="12" r="2.4" />
      <path d="M4 17c0 2 1.5 4 3.5 4M20 17c0 2-1.5 4-3.5 4" />
    </>
  ),
  watch: (
    <>
      <rect x="7" y="6" width="10" height="12" rx="3" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 10.6V12l1 .8M9.5 3.5h5M9.5 20.5h5" />
    </>
  ),
  speaker: (
    <>
      <rect x="7" y="2" width="10" height="20" rx="3" />
      <circle cx="12" cy="12" r="3.3" />
      <circle cx="12" cy="12" r="1.1" />
      <circle cx="12" cy="5.3" r="0.6" />
    </>
  ),
}

export const ICON_LABELS: Record<string, string> = {
  headphones: "headphones",
  vrheadset: "vr headset",
  watch: "watch",
  speaker: "speaker",
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill={filled ? "#FBBF24" : "none"}
      stroke={filled ? "#FBBF24" : "rgba(255,255,255,0.3)"}
      strokeWidth="1.6"
    >
      <path d="M12 2l3.1 6.6 7.1.8-5.3 4.9 1.4 7.1-6.3-3.6-6.3 3.6 1.4-7.1L2 9.4l7.1-.8z" />
    </svg>
  )
}

export function ProductIconImage({ icon, className }: { icon?: ProductIcon; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={88}
      height={88}
      fill="none"
      stroke="rgba(0,0,0,0.32)"
      strokeWidth="1.6"
      className={className}
    >
      {ICONS[icon || "headphones"] || ICONS.headphones}
    </svg>
  )
}

export function ProductCard({
  product = {
    name: "Wireless Headphones",
    price: 89,
    desc: "Premium noise-cancelling audio with all-day comfort.",
    icon: "headphones",
    themeFrom: "#1AA3E8",
    themeTo: "#0B3B63",
    rating: 4,
    specs: [
      { label: "AUDIO", value: "Fast charging", color: "#22D3EE" },
      { label: "COMFORT", value: "Noise cancelling", color: "#22D3EE" },
      { label: "BATTERY", value: "40hr battery", color: "#22D3EE" },
    ],
  },
  mode = "preview",
  onEdit,
  onDelete,
  onAddToCart,
  canEdit = true,
}: ProductCardProps) {
  const {
    name = "Product Name",
    price = 0,
    category,
    icon = "headphones",
    themeFrom = "#1AA3E8",
    themeTo = "#0B3B63",
    rating = 0,
    specs = [],
  } = product

  const description = product.desc || product.description || ""
  const isGrid = mode === "grid"

  return (
    <div
      className="group relative flex flex-col justify-between overflow-hidden rounded-[20px] p-5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.5)] transition-all hover:scale-[1.01] hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.6)]"
      style={{
        background: `linear-gradient(135deg, ${themeFrom || "#1AA3E8"}, ${themeTo || "#0B3B63"})`,
        minHeight: 420,
        width: "100%",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif',
      }}
    >
      {/* Price Badge */}
      <div className="absolute top-4 right-4 rounded-full bg-black/25 px-3.5 py-1.5 text-[13px] font-extrabold text-white backdrop-blur-sm z-10">
        ${typeof price === "number" ? price.toFixed(price % 1 === 0 ? 0 : 2) : price || 0}
      </div>

      {/* Grid Mode Action Overlay OR Category Badge */}
      {isGrid && canEdit ? (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
          {onEdit && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              aria-label={`Edit ${name}`}
              title="Edit product"
              className="flex size-8 items-center justify-center rounded-lg bg-black/30 text-white shadow-md hover:bg-black/50 transition-colors backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Edit2 className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              aria-label={`Delete ${name}`}
              title="Delete product"
              className="flex size-8 items-center justify-center rounded-lg bg-black/30 text-white shadow-md hover:bg-red-600/80 transition-colors backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      ) : (
        category && (
          <div className="absolute top-4 left-4 rounded-full bg-black/25 px-3 py-1 text-[11px] font-extrabold text-white uppercase tracking-wider backdrop-blur-sm z-10">
            {category}
          </div>
        )
      )}

      {/* Icon Zone */}
      <div className="flex flex-1 flex-col items-center justify-center gap-1.5 py-5">
        <svg
          viewBox="0 0 24 24"
          width={88}
          height={88}
          fill="none"
          stroke="rgba(0,0,0,0.32)"
          strokeWidth="1.6"
          className="transition-transform duration-300 group-hover:scale-105"
        >
          {ICONS[icon || "headphones"] || ICONS.headphones}
        </svg>
        <div className="text-[10px] font-semibold text-black/30 uppercase tracking-wider">
          {ICON_LABELS[icon || "headphones"] || icon}
        </div>
      </div>

      {/* Product Name */}
      <div className="mb-2.5 text-[18px] font-extrabold leading-tight text-white uppercase tracking-wide line-clamp-1">
        {name || "Untitled Product"}
      </div>

      {/* Description & Specifications */}
      <div className="mb-3.5 flex gap-3.5 items-start">
        <div className="flex-1 text-[12px] leading-relaxed text-white/70 line-clamp-3">
          {description || "No description provided."}
        </div>
        {specs && specs.length > 0 && (
          <div className="flex min-w-[110px] max-w-[130px] flex-col gap-2 shrink-0">
            {specs.slice(0, 3).map((s, i) => (
              <div key={i} className="min-w-0">
                <div
                  className="mb-0.5 text-[9.5px] font-extrabold tracking-wide uppercase truncate"
                  style={{ color: s.color || "#22D3EE" }}
                >
                  {s.label}
                </div>
                <div className="text-[10.5px] font-medium text-white/65 truncate">
                  {s.value}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Star Rating */}
      <div className="mb-3.5 flex gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} filled={n <= rating} />
        ))}
      </div>

      {/* Primary CTA / Edit Action */}
      {isGrid && canEdit && onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          className="h-11 w-full rounded-xl border-none bg-black/25 text-[13.5px] font-bold text-white transition-colors hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Edit product
        </button>
      ) : (
        <button
          type="button"
          onClick={onAddToCart}
          className="h-11 w-full rounded-xl border-none bg-black/25 text-[13.5px] font-bold text-white transition-colors hover:bg-black/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          Add to cart
        </button>
      )}
    </div>
  )
}

export default ProductCard
