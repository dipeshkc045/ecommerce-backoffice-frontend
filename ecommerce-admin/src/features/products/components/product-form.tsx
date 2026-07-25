import { useState, useEffect, useRef } from "react"
import { Headphones, Watch, Volume2, Glasses, Star, Plus, Trash2, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  CATEGORIES,
  THEME_PRESETS,
  SPEC_ACCENT_COLORS,
  type ProductCategory,
  type ProductIcon,
  type ProductSpec,
} from "../types"

export interface ProductFormValues {
  name: string
  price: number | ""
  desc: string
  category: ProductCategory
  icon: ProductIcon
  themeFrom: string
  themeTo: string
  rating: number
  specs: ProductSpec[]
}

export const DEFAULT_FORM_VALUES: ProductFormValues = {
  name: "",
  price: 0,
  desc: "",
  category: CATEGORIES[0],
  icon: "headphones",
  themeFrom: THEME_PRESETS[0].from,
  themeTo: THEME_PRESETS[0].to,
  rating: 4,
  specs: [{ label: "AUDIO", value: "High Fidelity sound", color: SPEC_ACCENT_COLORS[0] }],
}

interface ProductFormProps {
  formValues: ProductFormValues
  onChange: (values: ProductFormValues) => void
  onSubmit: (values: ProductFormValues) => void
  onCancelEdit?: () => void
  isSubmitting?: boolean
  isEditing?: boolean
}

export function ProductForm({
  formValues,
  onChange,
  onSubmit,
  onCancelEdit,
  isSubmitting = false,
  isEditing = false,
}: ProductFormProps) {
  const [nameError, setNameError] = useState<string | null>(null)
  const nameInputRef = useRef<HTMLInputElement>(null)

  // Clear or validate errors on name change
  useEffect(() => {
    if (formValues.name.trim()) {
      setNameError(null)
    }
  }, [formValues.name])

  const updateField = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => {
    onChange({ ...formValues, [key]: value })
  }

  // Handle Preset Theme Selection
  const handleSelectPreset = (from: string, to: string) => {
    onChange({
      ...formValues,
      themeFrom: from,
      themeTo: to,
    })
  }

  // Active theme preset matching check
  const activePresetIndex = THEME_PRESETS.findIndex(
    (p) =>
      p.from.toLowerCase() === formValues.themeFrom.toLowerCase() &&
      p.to.toLowerCase() === formValues.themeTo.toLowerCase()
  )

  // Specs handling
  const handleAddSpec = () => {
    const nextColorIndex = formValues.specs.length % SPEC_ACCENT_COLORS.length
    const nextColor = SPEC_ACCENT_COLORS[nextColorIndex]
    const updatedSpecs = [
      ...formValues.specs,
      { label: "", value: "", color: nextColor },
    ]
    updateField("specs", updatedSpecs)
  }

  const handleUpdateSpec = (index: number, field: keyof ProductSpec, value: string) => {
    const updated = [...formValues.specs]
    if (field === "label") {
      updated[index] = { ...updated[index], label: value.toUpperCase() }
    } else {
      updated[index] = { ...updated[index], [field]: value }
    }
    updateField("specs", updated)
  }

  const handleRemoveSpec = (index: number) => {
    const updated = formValues.specs.filter((_, i) => i !== index)
    updateField("specs", updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValues.name.trim()) {
      setNameError("Product name is required")
      nameInputRef.current?.focus()
      return
    }
    if (typeof formValues.price !== "number" || formValues.price < 0) {
      return
    }
    onSubmit(formValues)
  }

  const ICON_OPTIONS: { id: ProductIcon; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "headphones", label: "Headphones", icon: Headphones },
    { id: "vrheadset", label: "VR Headset", icon: Glasses },
    { id: "watch", label: "Watch", icon: Watch },
    { id: "speaker", label: "Speaker", icon: Volume2 },
  ]

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-xl border border-[var(--color-border)] bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Product" : "Create New Product"}
          </h2>
          <p className="text-xs text-gray-500">
            {isEditing
              ? "Update details for the selected product."
              : "Fill out the fields to add a product to the catalog."}
          </p>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-900"
          >
            <X className="size-3.5" />
            Cancel Edit
          </button>
        )}
      </div>

      {/* 1. Product Name */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-name" className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Product Name <span className="text-red-500">*</span>
        </label>
        <input
          id="product-name"
          ref={nameInputRef}
          type="text"
          value={formValues.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="e.g. Nimbus Pro Wireless Headphones"
          className={cn(
            "rounded-lg border px-3 py-2 text-sm text-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500",
            nameError ? "border-red-500 ring-1 ring-red-500" : "border-gray-300 hover:border-gray-400"
          )}
        />
        {nameError && <p className="text-xs font-medium text-red-600">{nameError}</p>}
      </div>

      {/* 2. Price (USD) */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-price" className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Price (USD) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 font-medium">$</span>
          <input
            id="product-price"
            type="number"
            step="0.01"
            min="0"
            value={formValues.price}
            onChange={(e) => updateField("price", e.target.value === "" ? "" : parseFloat(e.target.value))}
            placeholder="0.00"
            className="w-full rounded-lg border border-gray-300 py-2 pl-7 pr-3 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* 3. Description */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-desc" className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Description
        </label>
        <textarea
          id="product-desc"
          rows={3}
          value={formValues.desc}
          onChange={(e) => updateField("desc", e.target.value)}
          placeholder="Brief product description for the storefront..."
          className="rounded-lg border border-gray-300 p-3 text-sm text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />
      </div>

      {/* 4. Category */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="product-category" className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="product-category"
          value={formValues.category}
          onChange={(e) => updateField("category", e.target.value as ProductCategory)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 bg-white transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* 5. Icon Visual Picker */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Product Icon
        </label>
        <div className="grid grid-cols-4 gap-3">
          {ICON_OPTIONS.map((opt) => {
            const IconComp = opt.icon
            const isSelected = formValues.icon === opt.id
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => updateField("icon", opt.id)}
                aria-label={`Select ${opt.label} icon`}
                aria-pressed={isSelected}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 rounded-lg border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-sm"
                    : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                )}
              >
                <IconComp className="size-6" />
                <span className="text-[11px] font-medium">{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* 6. Card Color Theme */}
      <div className="flex flex-col gap-3">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Card Color Theme
        </label>
        
        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {THEME_PRESETS.map((preset, index) => {
            const isSelected = activePresetIndex === index
            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset.from, preset.to)}
                title={preset.name}
                aria-label={`Select ${preset.name} theme preset`}
                aria-pressed={isSelected}
                className={cn(
                  "relative flex size-9 items-center justify-center rounded-lg border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500",
                  isSelected ? "ring-2 ring-indigo-600 ring-offset-2 border-transparent scale-105" : "border-gray-200 hover:scale-105"
                )}
                style={{
                  background: `linear-gradient(135deg, ${preset.from}, ${preset.to})`,
                }}
              >
                {isSelected && <Check className="size-4 text-white drop-shadow" />}
              </button>
            )
          })}
        </div>

        {/* Custom Hex Pickers */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
            <input
              type="color"
              value={formValues.themeFrom}
              onChange={(e) => updateField("themeFrom", e.target.value)}
              className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Gradient start color"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-gray-500">From (Hex)</span>
              <input
                type="text"
                value={formValues.themeFrom}
                onChange={(e) => updateField("themeFrom", e.target.value)}
                className="w-full text-xs font-mono font-medium text-gray-800 uppercase focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-2">
            <input
              type="color"
              value={formValues.themeTo}
              onChange={(e) => updateField("themeTo", e.target.value)}
              className="size-7 cursor-pointer rounded border-0 bg-transparent p-0"
              aria-label="Gradient end color"
            />
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-gray-500">To (Hex)</span>
              <input
                type="text"
                value={formValues.themeTo}
                onChange={(e) => updateField("themeTo", e.target.value)}
                className="w-full text-xs font-mono font-medium text-gray-800 uppercase focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 7. Rating */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
          Rating (1–5 Stars)
        </label>
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const isFilled = star <= formValues.rating
            return (
              <button
                key={star}
                type="button"
                onClick={() => updateField("rating", star)}
                aria-label={`Set rating to ${star} star${star > 1 ? "s" : ""}`}
                className="p-1 rounded transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Star
                  className={cn(
                    "size-6",
                    isFilled ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200 hover:text-amber-300"
                  )}
                />
              </button>
            )
          })}
          <span className="ml-2 text-xs font-bold text-gray-600">{formValues.rating} / 5</span>
        </div>
      </div>

      {/* 8. Repeatable Specs List */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
            Specifications
          </label>
          <button
            type="button"
            onClick={handleAddSpec}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700"
          >
            <Plus className="size-3.5" />
            Add Spec Row
          </button>
        </div>

        {formValues.specs.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No specifications added yet.</p>
        ) : (
          <div className="space-y-2">
            {formValues.specs.map((spec, index) => (
              <div key={index} className="flex items-center gap-2">
                {/* Spec Accent Color Picker */}
                <input
                  type="color"
                  value={spec.color}
                  onChange={(e) => handleUpdateSpec(index, "color", e.target.value)}
                  className="size-7 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
                  title="Spec accent color"
                />

                {/* Spec Label (Auto Uppercased) */}
                <input
                  type="text"
                  value={spec.label}
                  onChange={(e) => handleUpdateSpec(index, "label", e.target.value)}
                  placeholder="LABEL (e.g. AUDIO)"
                  className="w-1/3 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs uppercase font-bold text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Spec Value */}
                <input
                  type="text"
                  value={spec.value}
                  onChange={(e) => handleUpdateSpec(index, "value", e.target.value)}
                  placeholder="Value (e.g. Active Noise Canceling)"
                  className="flex-1 rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900 transition-colors hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />

                {/* Remove Row Button */}
                <button
                  type="button"
                  onClick={() => handleRemoveSpec(index)}
                  title="Remove spec"
                  aria-label="Remove spec row"
                  className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Submission Actions */}
      <div className="flex items-center justify-end gap-3 border-t border-[var(--color-border)] pt-4">
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="rounded-lg border border-gray-300 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
            isSubmitting && "opacity-60 cursor-not-allowed"
          )}
        >
          {isSubmitting ? (
            <span>Saving...</span>
          ) : isEditing ? (
            <span>Update Product</span>
          ) : (
            <span>Save Product</span>
          )}
        </button>
      </div>
    </form>
  )
}
