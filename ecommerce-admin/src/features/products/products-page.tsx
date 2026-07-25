import { useState } from "react"
import { toast } from "sonner"
import { usePermission } from "@/hooks/use-auth"
import type { Product } from "./types"
import {
  useProducts,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  type CreateProductPayload,
} from "./api"
import { useCategories } from "@/features/categories/api"
import { ProductForm, DEFAULT_FORM_VALUES, type ProductFormValues } from "./components/product-form"
import { ProductCard } from "./components/product-card"
import { ProductGrid } from "./components/product-grid"

export function ProductsPage() {
  const canEdit = usePermission("products:edit")

  // State management
  const [selectedCategory, setSelectedCategory] = useState<string>("All Categories")
  const [formValues, setFormValues] = useState<ProductFormValues>(DEFAULT_FORM_VALUES)
  const [editingProductId, setEditingProductId] = useState<number | null>(null)

  // API hooks
  const { data: allProducts = [], isLoading: isLoadingAll } = useProducts()
  const { data: categories = [] } = useCategories()

  const createProductMutation = useCreateProduct()
  const updateProductMutation = useUpdateProduct()
  const deleteProductMutation = useDeleteProduct()

  const isSubmitting = createProductMutation.isPending || updateProductMutation.isPending

  // Filter products by selected category name client-side (API filters by ID; we keep it simple)
  const filteredProducts =
    selectedCategory === "All Categories"
      ? allProducts
      : allProducts.filter((p) => p.category?.name === selectedCategory)

  // Handle Edit Action from Grid
  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id)
    setFormValues({
      name: product.name,
      price: product.price,
      description: product.description || "",
      categoryId: product.category?.id ?? "",
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
    const payload: CreateProductPayload = {
      name: values.name.trim(),
      price: typeof values.price === "number" ? values.price : 0,
      description: values.description.trim(),
      categoryId: typeof values.categoryId === "number" ? values.categoryId : 0,
      icon: values.icon,
      themeFrom: values.themeFrom,
      themeTo: values.themeTo,
      rating: values.rating,
      specs: values.specs.filter((s) => s.label.trim() !== "" || s.value.trim() !== ""),
    }

    try {
      if (editingProductId !== null) {
        await updateProductMutation.mutateAsync({
          id: editingProductId,
          data: payload,
        })
        toast.success("Product updated successfully")
      } else {
        await createProductMutation.mutateAsync(payload)
        toast.success("Product created successfully")
      }
      // Reset Form to Clean State
      handleCancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save product")
    }
  }

  // Handle Delete Action
  const handleDeleteProduct = async (id: number) => {
    try {
      await deleteProductMutation.mutateAsync(id)
      toast.success("Product deleted")
      if (editingProductId === id) handleCancelEdit()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete product")
    }
  }

  // Build a live preview product from form values for the preview card
  const previewProduct = {
    name: formValues.name,
    price: typeof formValues.price === "number" ? formValues.price : 0,
    description: formValues.description,
    category: categories.find((c) => c.id === formValues.categoryId),
    icon: formValues.icon,
    themeFrom: formValues.themeFrom,
    themeTo: formValues.themeTo,
    rating: formValues.rating,
    specs: formValues.specs,
  }

  // Derive unique category names for the grid filter from loaded products
  const categoryOptions = [
    "All Categories",
    ...Array.from(new Set(allProducts.map((p) => p.category?.name).filter(Boolean))),
  ]

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Product Management</h1>
        <p className="text-sm text-gray-500">
          Create, customize, and manage products for the storefront catalog.
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
              categories={categories}
            />
          ) : (
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm text-gray-500 text-xs font-medium">
              You have read-only access. The <span className="font-bold text-gray-900">products:edit</span> permission is required to create or edit products.
            </div>
          )}
        </div>

        {/* Right Panel: Live Preview */}
        <div className="lg:col-span-5 xl:col-span-4 sticky top-6">
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
            <ProductCard product={previewProduct} mode="preview" />
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
          isLoading={isLoadingAll}
          categoryOptions={categoryOptions}
        />
      </div>
    </div>
  )
}
