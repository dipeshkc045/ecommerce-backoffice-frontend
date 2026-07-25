import { useState } from "react"
import { Edit3, Trash2, Zap, AlertTriangle, Layers } from "lucide-react"
import { ICON_MAP, type Category } from "../types"

interface CategoryListProps {
  categories: Category[]
  onEdit: (category: Category) => void
  onDelete: (id: string) => void
  canEdit?: boolean
  isLoading?: boolean
}

export function CategoryList({
  categories,
  onEdit,
  onDelete,
  canEdit = true,
  isLoading = false,
}: CategoryListProps) {
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  const handleConfirmDelete = () => {
    if (deleteTarget) {
      onDelete(deleteTarget.id)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Active Categories ({categories.length})
        </h3>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-16 animate-pulse rounded-xl border border-slate-800 bg-slate-950/50"
            />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 bg-slate-950 p-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-800 text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-white">No categories created yet</h4>
          <p className="mt-1 text-xs text-slate-400 max-w-sm">
            Use the form to create your first popular category shortcut.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          {categories.map((cat) => {
            const IconComp = ICON_MAP[cat.icon] || Zap
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between p-3.5 hover:bg-slate-900/60 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full ${cat.bgColor} flex items-center justify-center`}>
                    <IconComp className="w-5 h-5 text-slate-800" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white">{cat.name}</h4>
                    <span className="text-xs text-slate-500">Icon: {cat.icon}</span>
                  </div>
                </div>

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onEdit(cat)}
                      title="Edit Category"
                      aria-label={`Edit ${cat.name}`}
                      className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(cat)}
                      title="Delete Category"
                      aria-label={`Delete ${cat.name}`}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-500 mb-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-rose-500/10">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white">Delete Category</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-6">
              Are you sure you want to delete <span className="font-bold text-white">{deleteTarget.name}</span>? This category shortcut will be removed from the frontend banner.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-500"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="rounded-lg bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                Delete Category
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
