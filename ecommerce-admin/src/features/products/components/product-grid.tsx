import { useState } from "react"
import { Filter, PackageX, AlertTriangle } from "lucide-react"
import { CATEGORIES, type Product } from "../types"
import { ProductCard } from "./product-card"

interface ProductGridProps {
  products: Product[]
  totalProductCount: number
  selectedCategory: string
  onCategoryChange: (category: string) => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (productId: string) => void
  canEdit?: boolean
  isLoading?: boolean
}

export function ProductGrid({
  products,
  totalProductCount,
  selectedCategory,
  onCategoryChange,
  onEditProduct,
  onDeleteProduct,
  canEdit = true,
  isLoading = false,
}: ProductGridProps) {
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDeleteProduct(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Grid Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900">All Products</h2>
          <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-600">
            {products.length} {products.length === 1 ? "product" : "products"}
          </span>
        </div>

        {/* Category Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-gray-500" />
          <label htmlFor="grid-category-filter" className="sr-only">
            Filter by Category
          </label>
          <select
            id="grid-category-filter"
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-semibold text-gray-800 bg-white transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="All Categories">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid Content / Loading / Empty States */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl border border-gray-200 bg-gray-100"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center shadow-sm">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <PackageX className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-900">
            {totalProductCount === 0
              ? "No products yet"
              : "No products in this category yet"}
          </h3>
          <p className="mt-1 text-xs text-gray-500 max-w-sm">
            {totalProductCount === 0
              ? "Fill out the form above to add your first product to the catalog."
              : `There are currently no products under the "${selectedCategory}" category.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mode="grid"
              canEdit={canEdit}
              onEdit={() => onEditProduct(product)}
              onDelete={() => setDeleteTarget(product)}
            />
          ))}
        </div>
      )}

      {/* Lightweight Confirmation Modal for Delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-gray-900">Delete Product</h3>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-gray-900">{deleteTarget.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
