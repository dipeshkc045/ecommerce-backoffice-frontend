import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, unwrap, type ApiEnvelope } from "@/lib/api-client"
import type { Product, ProductIcon, ProductSpec } from "./types"

const productsKey = {
  all: ["products"] as const,
  filtered: (categoryId?: number) => ["products", { categoryId }] as const,
  detail: (id: number) => ["products", id] as const,
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface CreateProductPayload {
  name: string
  description: string
  price: number
  categoryId: number
  icon: ProductIcon
  themeFrom: string
  themeTo: string
  rating: number
  specs: ProductSpec[]
}

export type UpdateProductPayload = CreateProductPayload

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchProducts(categoryId?: number): Promise<Product[]> {
  const path = categoryId ? `/products?categoryId=${categoryId}` : "/products"
  const envelope = await apiClient.get<ApiEnvelope<Product[]>>(path)
  return unwrap(envelope)
}

export async function fetchProduct(id: number): Promise<Product> {
  const envelope = await apiClient.get<ApiEnvelope<Product>>(`/products/${id}`)
  return unwrap(envelope)
}

export async function createProductApi(data: CreateProductPayload): Promise<Product> {
  const envelope = await apiClient.post<ApiEnvelope<Product>>("/products", data)
  return unwrap(envelope)
}

export async function updateProductApi(id: number, data: UpdateProductPayload): Promise<Product> {
  const envelope = await apiClient.put<ApiEnvelope<Product>>(`/products/${id}`, data)
  return unwrap(envelope)
}

export async function deleteProductApi(id: number): Promise<void> {
  await apiClient.delete<ApiEnvelope<null>>(`/products/${id}`)
}

// ── TanStack Query hooks ──────────────────────────────────────────────────────

export function useProducts(categoryId?: number) {
  return useQuery({
    queryKey: categoryId ? productsKey.filtered(categoryId) : productsKey.all,
    queryFn: () => fetchProducts(categoryId),
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey.all })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductPayload }) =>
      updateProductApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey.all })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productsKey.all })
    },
  })
}
