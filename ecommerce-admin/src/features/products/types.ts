export interface ProductSpec {
  label: string
  value: string
  color: string
}

export type ProductIcon = "headphones" | "vrheadset" | "watch" | "speaker"

export const CATEGORIES = [
  "Audio",
  "Wearables",
  "Speakers",
  "Displays",
  "Smart Home",
  "Accessories",
  "Other",
] as const

export type ProductCategory = (typeof CATEGORIES)[number]

export interface Product {
  id: string
  name: string
  price: number
  desc: string
  category: ProductCategory
  icon: ProductIcon
  themeFrom: string
  themeTo: string
  rating: number
  specs: ProductSpec[]
  createdAt: string
  updatedAt: string
}

export interface ProductThemePreset {
  name: string
  from: string
  to: string
}

export const THEME_PRESETS: ProductThemePreset[] = [
  { name: "Indigo Dusk", from: "#4f46e5", to: "#7c3aed" },
  { name: "Cyber Cyan", from: "#06b6d4", to: "#3b82f6" },
  { name: "Sunset Flare", from: "#f59e0b", to: "#ef4444" },
  { name: "Emerald Glow", from: "#10b981", to: "#059669" },
  { name: "Dark Obsidian", from: "#374151", to: "#111827" },
]

export const SPEC_ACCENT_COLORS = [
  "#6366f1",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
]
