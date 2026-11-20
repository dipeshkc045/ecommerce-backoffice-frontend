import type { Attribute } from "@/features/catalog/api"
import type { Product, ProductInput, SkuInput } from "./api"

/** What the product form holds while staff type. Numbers stay text until saved, so "12." doesn't jump around. */
export type AttributeValue = string | boolean | string[]

export interface ProductFormState {
  name: string
  description: string
  nameNe: string
  descriptionNe: string
  brandId: string
  primaryCategoryId: string
  categoryIds: string[]
  attributes: Record<string, AttributeValue>
  skus: SkuInput[]
}

function toFormValue(value: unknown): AttributeValue {
  if (Array.isArray(value)) return value.map(String)
  if (typeof value === "boolean") return value
  return value === null || value === undefined ? "" : String(value)
}

export function fromProduct(product: Product): ProductFormState {
  return {
    name: product.name,
    description: product.description ?? "",
    nameNe: product.translations?.ne?.name ?? "",
    descriptionNe: product.translations?.ne?.description ?? "",
    brandId: product.brand_id ?? "",
    primaryCategoryId: product.primary_category_id ?? "",
    categoryIds: product.category_ids ?? [],
    attributes: Object.fromEntries(Object.entries(product.attributes ?? {}).map(([code, v]) => [code, toFormValue(v)])),
    skus: product.skus.map((s) => ({ ...s })),
  }
}

function isEmpty(value: AttributeValue): boolean {
  return value === "" || (Array.isArray(value) && value.length === 0)
}

/** The request body. Attributes without a value are left out; numbers become numbers. */
export function toInput(state: ProductFormState, definitions: Attribute[]): ProductInput {
  const typeOf = new Map(definitions.map((d) => [d.code, d.type]))
  const attributes: Record<string, unknown> = {}
  for (const [code, value] of Object.entries(state.attributes)) {
    if (isEmpty(value)) continue
    attributes[code] = typeOf.get(code) === "NUMBER" && typeof value === "string" ? Number(value) : value
  }
  const ne = { name: state.nameNe.trim() || null, description: state.descriptionNe.trim() || null }
  const categoryIds = state.categoryIds
  return {
    name: state.name,
    description: state.description || null,
    translations: ne.name || ne.description ? { ne } : {},
    brand_id: state.brandId || null,
    // The primary category must be one of the product's categories: drop it if it was unticked
    primary_category_id: categoryIds.includes(state.primaryCategoryId) ? state.primaryCategoryId : null,
    category_ids: categoryIds,
    attributes,
    skus: state.skus.filter((s) => s.sku_id || s.sku_code?.trim()),
  }
}
