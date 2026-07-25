import React, { useState } from "react"
import { Sparkles } from "lucide-react"
import { usePermission } from "@/hooks/use-auth"
import type { Category } from "./types"
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "./api"
import { CategoryPreview } from "./components/category-preview"
import { CategoryForm, type CategoryFormValues } from "./components/category-form"
import { CategoryList } from "./components/category-list"

const DEFAULT_FORM_DATA: CategoryFormValues = {
  name: "",
  icon: "Zap",
  bgColor: "bg-indigo-100",
  href: "",
}

export function CategoriesPage() {
  const canEdit = usePermission("categories:edit")

  // State
  const [formData, setFormData] = useState<CategoryFormValues>(DEFAULT_FORM_DATA)
  const [editingId, setEditingId] = useState<string | null>(null)

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
    })
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const handleCancel = () => {
    setEditingId(null)
    setFormData(DEFAULT_FORM_DATA)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) return

    if (editingId) {
      await updateCategoryMutation.mutateAsync({
        id: editingId,
        data: {
          name: formData.name.trim(),
          icon: formData.icon,
          bgColor: formData.bgColor,
          href: formData.href ? formData.href.trim() : `/category/${formData.name.toLowerCase().replace(/\s+/g, "-")}`,
        },
      })
    } else {
      await createCategoryMutation.mutateAsync({
        name: formData.name.trim(),
        icon: formData.icon,
        bgColor: formData.bgColor,
        href: formData.href ? formData.href.trim() : `/category/${formData.name.toLowerCase().replace(/\s+/g, "-")}`,
      })
    }

    handleCancel()
  }

  const handleDelete = async (id: string) => {
    await deleteCategoryMutation.mutateAsync(id)
    if (editingId === id) {
      handleCancel()
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
