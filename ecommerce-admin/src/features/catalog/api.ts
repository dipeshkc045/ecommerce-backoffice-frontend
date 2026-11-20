import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { apiClient } from "@/lib/api-client"

// ── Shapes of /admin/v1/categories, /brands and /attributes (ecommerce-platform #33) ────────────────────────────
// English is the default text; other languages are in `translations`, by locale code.

export const LOCALES = [
  { code: "en", label: "English" },
  { code: "ne", label: "नेपाली (Nepali)" },
] as const

export interface AttributeRef {
  attribute_id: string
  required: boolean
}

export interface Category {
  id: string
  parent_id?: string | null
  slug: string
  name: string
  translations: Record<string, string>
  position: number
  visible: boolean
  attributes: AttributeRef[]
  version: number
}

export interface CategoryInput {
  parent_id: string | null
  slug: string
  name: string
  translations: Record<string, string>
  position: number
  visible: boolean
  attributes: AttributeRef[]
}

export interface Brand {
  id: string
  name: string
  slug: string
  active: boolean
  version: number
}

export interface BrandInput {
  name: string
  slug: string
  active: boolean
}

export const ATTRIBUTE_TYPES = ["STRING", "NUMBER", "BOOLEAN", "ENUM", "MULTI_ENUM"] as const
export type AttributeType = (typeof ATTRIBUTE_TYPES)[number]

export interface AttributeOption {
  code: string
  label: string
  translations: Record<string, string>
}

export interface AttributeLimits {
  max_length?: number | null
  min?: number | null
  max?: number | null
}

export interface Attribute {
  id: string
  code: string
  type: AttributeType
  label: string
  translations: Record<string, string>
  unit?: string | null
  filterable: boolean
  searchable: boolean
  options: AttributeOption[]
  limits: AttributeLimits
  version: number
}

export interface AttributeInput {
  code: string
  type: AttributeType
  label: string
  translations: Record<string, string>
  unit: string | null
  filterable: boolean
  searchable: boolean
  options: AttributeOption[]
  limits: AttributeLimits | null
}

// ── One set of hooks per resource: list, create (Idempotency-Key), edit (If-Match with the version) ─────────────

function resource<T extends { id: string; version: number }, I>(path: string, name: string) {
  const listKey = ["catalog", name] as const
  return {
    useList: () =>
      useQuery({ queryKey: listKey, queryFn: async () => (await apiClient.get<{ items: T[] }>(path)).items }),
    useCreate: () => {
      const qc = useQueryClient()
      return useMutation({
        // The caller makes the key when the form opens, so a double click or a retry creates one record
        mutationFn: ({ key, input }: { key: string; input: I }) =>
          apiClient.post<T>(path, input, { headers: { "Idempotency-Key": key } }),
        onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
      })
    },
    useEdit: () => {
      const qc = useQueryClient()
      return useMutation({
        mutationFn: ({ item, input }: { item: T; input: I }) =>
          apiClient.put<T>(`${path}/${item.id}`, input, { headers: { "If-Match": `"${item.version}"` } }),
        onSuccess: () => qc.invalidateQueries({ queryKey: listKey }),
        // 412 means someone else changed it: reload so the next attempt starts from their version
        onError: () => qc.invalidateQueries({ queryKey: listKey }),
      })
    },
  }
}

export const categoriesApi = resource<Category, CategoryInput>("/admin/v1/categories", "categories")
export const brandsApi = resource<Brand, BrandInput>("/admin/v1/brands", "brands")
export const attributesApi = resource<Attribute, AttributeInput>("/admin/v1/attributes", "attributes")

// ── Category tree helpers ───────────────────────────────────────────────────────────────────────────────────────

export interface CategoryNode {
  category: Category
  depth: number
}

function childrenOf(items: Category[]): Map<string | null, Category[]> {
  const byParent = new Map<string | null, Category[]>()
  for (const c of items) {
    const key = c.parent_id ?? null
    const list = byParent.get(key) ?? []
    list.push(c)
    byParent.set(key, list)
  }
  for (const list of byParent.values()) {
    list.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name))
  }
  return byParent
}

/** The tree as indented rows, parents before children, siblings by position then name. */
export function flattenTree(items: Category[]): CategoryNode[] {
  const byParent = childrenOf(items)
  const rows: CategoryNode[] = []
  const seen = new Set<string>()
  const walk = (parent: string | null, depth: number) => {
    for (const category of byParent.get(parent) ?? []) {
      if (seen.has(category.id)) continue // a cycle can never loop us forever
      seen.add(category.id)
      rows.push({ category, depth })
      walk(category.id, depth + 1)
    }
  }
  walk(null, 0)
  return rows
}

/** The category and everything below it: a category cannot become its own parent. */
export function descendantsOf(items: Category[], id: string): Set<string> {
  const byParent = childrenOf(items)
  const result = new Set<string>([id])
  const walk = (parent: string) => {
    for (const child of byParent.get(parent) ?? []) {
      if (!result.has(child.id)) {
        result.add(child.id)
        walk(child.id)
      }
    }
  }
  walk(id)
  return result
}

/**
 * The attributes a product's categories ask for: those of each chosen category and of all its ancestors. An attribute
 * is required if any of them requires it (the platform refuses to publish without a value).
 */
export function attributeRequirements(categoryIds: string[], items: Category[]): Map<string, boolean> {
  const byId = new Map(items.map((c) => [c.id, c]))
  const requirements = new Map<string, boolean>()
  for (const start of categoryIds) {
    const visited = new Set<string>()
    let current = byId.get(start)
    while (current && !visited.has(current.id)) {
      visited.add(current.id)
      for (const ref of current.attributes) {
        requirements.set(ref.attribute_id, (requirements.get(ref.attribute_id) ?? false) || ref.required)
      }
      current = current.parent_id ? byId.get(current.parent_id) : undefined
    }
  }
  return requirements
}

/** "Dhaka Topi (Men's)" → "dhaka-topi-mens": a starting suggestion for a slug. */
export function suggestSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
}

/** The translations map for the API: only languages that have text. */
export function cleanTranslations(translations: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(translations).filter(([, text]) => text.trim() !== ""))
}
