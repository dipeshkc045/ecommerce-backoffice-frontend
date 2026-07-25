import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { INITIAL_CATEGORIES, type Category } from "./types"

const STORAGE_KEY = "nimbus_categories_v1"

function getStoredCategories(): Category[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_CATEGORIES))
      return INITIAL_CATEGORIES
    }
    return JSON.parse(data) as Category[]
  } catch {
    return INITIAL_CATEGORIES
  }
}

function saveStoredCategories(categories: Category[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(categories))
}

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms))

export async function fetchCategories(): Promise<Category[]> {
  await delay()
  return getStoredCategories()
}

export async function createCategoryApi(
  data: Omit<Category, "id" | "createdAt" | "updatedAt">
): Promise<Category> {
  await delay()
  const categories = getStoredCategories()
  const newCategory: Category = {
    ...data,
    id: `cat_${crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  categories.push(newCategory)
  saveStoredCategories(categories)
  return newCategory
}

export async function updateCategoryApi(
  id: string,
  data: Partial<Omit<Category, "id" | "createdAt">>
): Promise<Category> {
  await delay()
  const categories = getStoredCategories()
  const index = categories.findIndex((c) => c.id === id)
  if (index === -1) {
    throw new Error(`Category with id ${id} not found`)
  }
  const updated: Category = {
    ...categories[index],
    ...data,
    updatedAt: new Date().toISOString(),
  }
  categories[index] = updated
  saveStoredCategories(categories)
  return updated
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await delay()
  const categories = getStoredCategories()
  const filtered = categories.filter((c) => c.id !== id)
  saveStoredCategories(filtered)
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Category> }) =>
      updateCategoryApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: deleteCategoryApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}
