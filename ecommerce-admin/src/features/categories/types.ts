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
  id: string
  name: string
  icon: string
  bgColor: string
  href?: string
  createdAt?: string
  updatedAt?: string
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

export const INITIAL_CATEGORIES: Category[] = [
  { id: "1", name: "Electronics", icon: "Zap", bgColor: "bg-indigo-100", href: "/category/electronics" },
  { id: "2", name: "Fashion", icon: "Shirt", bgColor: "bg-rose-100", href: "/category/fashion" },
  { id: "3", name: "Luxury", icon: "Gem", bgColor: "bg-amber-100", href: "/category/luxury" },
  { id: "4", name: "Home Decor", icon: "Home", bgColor: "bg-emerald-100", href: "/category/home-decor" },
  { id: "5", name: "Health & Beauty", icon: "Heart", bgColor: "bg-pink-100", href: "/category/health-beauty" },
  { id: "6", name: "Groceries", icon: "ShoppingBag", bgColor: "bg-teal-100", href: "/category/groceries" },
  { id: "7", name: "Sneakers", icon: "Activity", bgColor: "bg-blue-100", href: "/category/sneakers" },
  { id: "8", name: "Sports", icon: "Trophy", bgColor: "bg-orange-100", href: "/category/sports" },
  { id: "9", name: "Books", icon: "BookOpen", bgColor: "bg-yellow-100", href: "/category/books" },
  { id: "10", name: "Gaming", icon: "Gamepad2", bgColor: "bg-purple-100", href: "/category/gaming" },
]
