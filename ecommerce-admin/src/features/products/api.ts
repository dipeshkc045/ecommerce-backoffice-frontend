import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import type { Product } from "./types"

const STORAGE_KEY = "nimbus_products_v1"

const INITIAL_SEED_PRODUCTS: Product[] = [
  {
    id: "prod_1",
    name: "Nimbus Pro Wireless",
    price: 299.99,
    desc: "Premium active noise canceling headphones with spatial audio and ultra-low latency.",
    category: "Audio",
    icon: "headphones",
    themeFrom: "#4f46e5",
    themeTo: "#7c3aed",
    rating: 5,
    specs: [
      { label: "AUDIO", value: "Active Noise Canceling", color: "#6366f1" },
      { label: "BATTERY", value: "40 hrs playback", color: "#ec4899" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  {
    id: "prod_2",
    name: "Nimbus Vision VR",
    price: 999.0,
    desc: "Next-generation mixed reality headset with dual 4K micro-OLED displays.",
    category: "Wearables",
    icon: "vrheadset",
    themeFrom: "#06b6d4",
    themeTo: "#3b82f6",
    rating: 5,
    specs: [
      { label: "DISPLAY", value: "Dual 4K Micro-OLED", color: "#06b6d4" },
      { label: "WEIGHT", value: "320g Ultra-lightweight", color: "#8b5cf6" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: "prod_3",
    name: "Nimbus SoundPulse Speaker",
    price: 149.5,
    desc: "Portable 360-degree room-filling acoustic speaker with deep bass response.",
    category: "Speakers",
    icon: "speaker",
    themeFrom: "#f59e0b",
    themeTo: "#ef4444",
    rating: 4,
    specs: [
      { label: "SOUND", value: "360° Spatial Acoustic Engine", color: "#f59e0b" },
      { label: "RATING", value: "IPX7 Waterproof", color: "#10b981" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: "prod_4",
    name: "Nimbus Horizon Smartwatch",
    price: 249.0,
    desc: "All-day wellness & fitness smartwatch with ECG, SpO2 monitoring and titanium casing.",
    category: "Wearables",
    icon: "watch",
    themeFrom: "#10b981",
    themeTo: "#059669",
    rating: 4,
    specs: [
      { label: "SENSOR", value: "ECG & SpO2 Heart Rate", color: "#10b981" },
      { label: "BATTERY", value: "7-day continuous battery", color: "#6366f1" },
    ],
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
  },
]

function getStoredProducts(): Product[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_PRODUCTS))
      return INITIAL_SEED_PRODUCTS
    }
    return JSON.parse(data) as Product[]
  } catch {
    return INITIAL_SEED_PRODUCTS
  }
}

function saveStoredProducts(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products))
}

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchProducts(category?: string): Promise<Product[]> {
  await delay()
  const products = getStoredProducts()
  if (!category || category === "All Categories") {
    return products
  }
  return products.filter((p) => p.category === category)
}

export async function createProductApi(
  data: Omit<Product, "id" | "createdAt" | "updatedAt">
): Promise<Product> {
  await delay()
  const products = getStoredProducts()
  const newProduct: Product = {
    ...data,
    id: `prod_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  products.unshift(newProduct)
  saveStoredProducts(products)
  return newProduct
}

export async function updateProductApi(
  id: string,
  data: Partial<Omit<Product, "id" | "createdAt">>
): Promise<Product> {
  await delay()
  const products = getStoredProducts()
  const index = products.findIndex((p) => p.id === id)
  if (index === -1) {
    throw new Error(`Product with id ${id} not found`)
  }
  const updated: Product = {
    ...products[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  products[index] = updated
  saveStoredProducts(products)
  return updated
}

export async function deleteProductApi(id: string): Promise<void> {
  await delay()
  const products = getStoredProducts()
  const filtered = products.filter((p) => p.id !== id)
  saveStoredProducts(filtered)
}

export function useProducts(category?: string) {
  return useQuery({
    queryKey: ["products", category],
    queryFn: () => fetchProducts(category),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
      updateProductApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] })
    },
  })
}
