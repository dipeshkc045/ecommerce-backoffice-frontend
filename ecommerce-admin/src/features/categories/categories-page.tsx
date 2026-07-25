import React, { useState } from "react"
import { Sparkles } from "lucide-react"
import { toast } from "sonner"
import { usePermission } from "@/hooks/use-auth"
import type { Category } from "./types"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  type CreateCategoryPayload,
} from "./api"
import { CategoryPreview } from "./components/category-preview"
import { CategoryForm, type CategoryFormValues } from "./components/category-form"
import { CategoryList } from "./components/category-list"

const DEFAULT_FORM_DATA: CategoryFormValues = {
  name: "",
  icon: "Zap",
  bgColor: "bg-indigo-100",
  href: "",
  description: "",
}

/** Derive a URL-safe slug from the category name. */
function toSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export function CategoriesPage() {
  const canEdit = usePermission("categories:edit")

  // State
  const [formData, setFormData] = useState<CategoryFormValues>(DEFAULT_FORM_DATA)
  const [editingId, setEditingId] = useState<number | null>(null)

  // API hooks
  const { data: categories = [], isLoading } = useCategories()
  const createCategoryMutation = useCreateCategory()
  const updateCategoryMutation = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

  const isSubmitting = createCategoryMutation.isPending || updateCategoryMutation.isPending

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      icon: category.icon,
      bgColor: category.bgColor,
      href: category.href || "",
      description: category.description ?? "",
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_DATA)
  }

  const buildPayload = (values: CategoryFormValues): CreateCategoryPayload => {
    const slug = toSlug(values.name)
    return {
      name: values.name.trim(),
      slug,
      icon: values.icon,
      bgColor: values.bgColor,
      href: values.href ? values.href.trim() : `/category/${slug}`,
      description: values.description?.trim() || undefined,
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    try {
      if (editingId !== null) {
        await updateCategoryMutation.mutateAsync({
          id: editingId,
          data: buildPayload(formData),
        })
        toast.success("Category updated successfully")
      } else {
        await createCategoryMutation.mutateAsync(buildPayload(formData))
        toast.success("Category created successfully")
      }
      handleCancel()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save category")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCategoryMutation.mutateAsync(id)
      toast.success("Category deleted")
      if (editingId === id) handleCancel()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete category")
    }
  }

  return (
    <div className="space-y-8 font-sans pb-12">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Explore Categories Section
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage home page popular category shortcuts and live preview frontend appearance.
          </p>
        </div>
      </div>

      {/* --- LIVE PREVIEW SECTION --- */}
      <CategoryPreview
        categories={categories}
        editingId={editingId}
        formData={formData}
      />

      {/* --- FORM & MANAGEMENT SECTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Form */}
        {canEdit ? (
          <CategoryForm
            formData={formData}
            onChange={setFormData}
            onSubmit={handleSave}
            onCancel={handleCancel}
            editingId={editingId}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit text-slate-400 text-xs">
            You have read-only access to categories. You require the <span className="font-bold text-white">categories:edit</span> permission to create or edit categories.
          </div>
        )}

        {/* Categories List Management Table */}
        <div className="lg:col-span-2">
          <CategoryList
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            canEdit={canEdit}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  )
}
