import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient, unwrap, type ApiEnvelope } from "@/lib/api-client"
import type { Category } from "./types"

const categoriesKey = {
  all: ["categories"] as const,
  detail: (id: number) => ["categories", id] as const,
}

// ── Request shapes ────────────────────────────────────────────────────────────

export interface CreateCategoryPayload {
  name: string
  slug: string
  icon: string
  bgColor: string
  href: string
  description?: string
}

export type UpdateCategoryPayload = CreateCategoryPayload

// ── API functions ─────────────────────────────────────────────────────────────

export async function fetchCategories(): Promise<Category[]> {
  const envelope = await apiClient.get<ApiEnvelope<Category[]>>("/categories")
  return unwrap(envelope)
}

export async function createCategoryApi(data: CreateCategoryPayload): Promise<Category> {
  const envelope = await apiClient.post<ApiEnvelope<Category>>("/categories", data)
  return unwrap(envelope)
}

export async function updateCategoryApi(id: number, data: UpdateCategoryPayload): Promise<Category> {
  const envelope = await apiClient.put<ApiEnvelope<Category>>(`/categories/${id}`, data)
  return unwrap(envelope)
}

export async function deleteCategoryApi(id: number): Promise<void> {
  await apiClient.delete<ApiEnvelope<null>>(`/categories/${id}`)
}

// ── TanStack Query hooks ──────────────────────────────────────────────────────

export function useCategories() {
  return useQuery({
    queryKey: categoriesKey.all,
    queryFn: fetchCategories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey.all })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryPayload }) =>
      updateCategoryApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey.all })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: categoriesKey.all })
    },
  })
}
