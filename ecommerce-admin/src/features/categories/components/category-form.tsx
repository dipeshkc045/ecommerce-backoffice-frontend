import React from "react"
import { Plus, X } from "lucide-react"
import { ICON_MAP, PRESET_COLORS } from "../types"

export interface CategoryFormValues {
  name: string
  icon: string
  bgColor: string
  href?: string
}

interface CategoryFormProps {
  formData: CategoryFormValues
  onChange: (values: CategoryFormValues) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  editingId: string | null
  isSubmitting?: boolean
}

export function CategoryForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  editingId,
  isSubmitting = false,
}: CategoryFormProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg h-fit">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {editingId ? "Edit Category" : "Create New Category"}
        </h3>
        {editingId && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Cancel
          </button>
        )}
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Name Input */}
        <div>
          <label htmlFor="category-title" className="block text-xs font-medium text-slate-400 mb-1">
            Category Title
          </label>
          <input
            id="category-title"
            type="text"
            placeholder="e.g. Smart Watches"
            value={formData.name}
            onChange={(e) => onChange({ ...formData, name: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
            required
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Select Icon</label>
          <div className="grid grid-cols-5 gap-2 bg-slate-950 p-3 rounded-lg border border-slate-800">
            {Object.keys(ICON_MAP).map((iconName) => {
              const IconComp = ICON_MAP[iconName]
              const isSelected = formData.icon === iconName
              return (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => onChange({ ...formData, icon: iconName })}
                  aria-label={`Select ${iconName} icon`}
                  aria-pressed={isSelected}
                  className={`p-2.5 rounded-lg flex items-center justify-center transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    isSelected
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <IconComp className="w-5 h-5" />
                </button>
              )
            })}
          </div>
        </div>

        {/* Background Color Picker */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">Background Tint</label>
          <div className="grid grid-cols-4 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color.value}
                type="button"
                onClick={() => onChange({ ...formData, bgColor: color.value })}
                title={color.label}
                aria-label={`Select ${color.label} tint`}
                className={`h-9 rounded-lg ${color.value} border-2 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  formData.bgColor === color.value
                    ? "border-indigo-500 scale-105"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              isSubmitting ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            <Plus className="w-4 h-4" />
            {isSubmitting
              ? "Saving..."
              : editingId
              ? "Update Item"
              : "Add to List"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={onCancel}
              className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
