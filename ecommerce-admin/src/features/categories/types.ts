import React from "react"
import {
  Zap,
  Shirt,
  Gem,
  Home,
  Heart,
  ShoppingBag,
  Activity,
  Trophy,
  BookOpen,
  Gamepad2,
  type LucideProps,
} from "lucide-react"

export interface Category {
  id: number
  name: string
  slug: string
  icon: string
  bgColor: string
  href: string
  description?: string
}

export interface PresetColor {
  label: string
  value: string
}

export const PRESET_COLORS: PresetColor[] = [
  { label: "Soft Indigo", value: "bg-indigo-100" },
  { label: "Rose Pink", value: "bg-rose-100" },
  { label: "Warm Amber", value: "bg-amber-100" },
  { label: "Fresh Emerald", value: "bg-emerald-100" },
  { label: "Blush Pink", value: "bg-pink-100" },
  { label: "Teal Mint", value: "bg-teal-100" },
  { label: "Cool Blue", value: "bg-blue-100" },
  { label: "Purple Mist", value: "bg-purple-100" },
]

export const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Zap,
  Shirt,
  Gem,
  Home,
  Heart,
  ShoppingBag,
  Activity,
  Trophy,
  BookOpen,
  Gamepad2,
}


