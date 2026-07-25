import { useState } from "react"
import { usePermission } from "@/hooks/use-auth"
import type { Product } from "./types"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
} from "./api"
import { ProductForm, DEFAULT_FORM_VALUES, type ProductFormValues } from "./components/product-form"
import { ProductCard } from "./components/product-card"
import { ProductGrid } from "./components/product-grid"

export function ProductsPage() {
  const canEdit = usePermission("products:edit")

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [formValues, setFormValues] = useState<ProductFormValues>(DEFAULT_FORM_VALUES)
  const [editingProductId, setEditingProductId] = useState<string | null>(null)

  // API hooks
  const { data: allProducts = [], isLoading: isLoadingAll } = useProducts("All Categories")
  const { data: filteredProducts = [], isLoading: isLoadingFiltered } = useProducts(selectedCategory)

  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending

  // Handle Edit Action from Grid
  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id)
    setFormValues({
      name: product.name,
      price: product.price,
      desc: product.desc || "",
      category: product.category,
      icon: product.icon,
      themeFrom: product.themeFrom,
      themeTo: product.themeTo,
      rating: product.rating,
      specs: product.specs ? [...product.specs] : [],
    })

    // Scroll smoothly up to the form
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancelEdit = () => {
    setEditingProductId(null)
    setFormValues(DEFAULT_FORM_VALUES)
  }

  // Handle Submit (Create or Update)
  const handleSubmitForm = async (values: ProductFormValues) => {
    const payload = {
      name: values.name.trim(),
      price: typeof values.price === "number" ? values.price : 0,
      desc: values.desc.trim(),
      category: values.category,
      icon: values.icon,
      themeFrom: values.themeFrom,
      themeTo: values.themeTo,
      rating: values.rating,
      specs: values.specs.filter((s) => s.label.trim() !== "" || s.value.trim() !== ""),
    }

    if (editingProductId) {
      await updateProductMutation.mutateAsync({
        id: editingProductId,
        data: payload,
      })
    } else {
      await createProductMutation.mutateAsync(payload)
    }

    // Reset Form to Clean State
    handleCancelEdit()
  }

  // Handle Delete Action
  const handleDeleteProduct = async (id: string) => {
    await deleteProductMutation.mutateAsync(id)
    if (editingProductId === id) {
      handleCancelEdit()
    }
  }

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Management</h1>
        <p className="text-sm text-gray-500">
          Create, customize, and manage products for the Nimbus storefront catalog.
        </p>
      </div>

      {/* Top Section: Form (Left ~2/3) + Sticky Live Preview (Right ~1/3) */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
        {/* Form Panel */}
        <div className="lg:col-span-7 xl:col-span-8">
          {canEdit ? (
            <ProductForm
              formValues={formValues}
              onChange={setFormValues}
              onSubmit={handleSubmitForm}
              onCancelEdit={handleCancelEdit}
              isSubmitting={isSubmitting}
              isEditing={!!editingProductId}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-gray-500 text-xs font-medium">
              You have read-only access to products. You must have the <span className="font-bold">products:edit</span> permission to create or edit products.
            </div>
          )}
        </div>

        {/* Live Preview Panel (Sticky) */}
        <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Live Storefront Preview
              </span>
              <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </span>
            </div>

            {/* Single Source of Truth ProductCard in Full Preview Mode */}
            <ProductCard product={formValues} mode="preview" />
          </div>
        </div>
      </div>

      {/* Bottom Section: Product Grid */}
      <div className="border-t border-gray-200 pt-8">
        <ProductGrid
          products={filteredProducts}
          totalProductCount={allProducts.length}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onEditProduct={handleEditProduct}
          onDeleteProduct={handleDeleteProduct}
          canEdit={canEdit}
          isLoading={isLoadingAll || isLoadingFiltered}
        />
      </div>
    </div>
  )
}
