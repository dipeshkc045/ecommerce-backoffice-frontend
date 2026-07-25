import { Eye, Zap } from "lucide-react"
import { ICON_MAP, type Category } from "../types"

interface CategoryPreviewProps {
  categories: Category[]
  editingId: string | null
  formData: {
    name: string
    icon: string
    bgColor: string
    href?: string
  }
}

export function CategoryPreview({
  categories,
  editingId,
  formData,
}: CategoryPreviewProps) {
  const DraftIconComponent = ICON_MAP[formData.icon] || Zap

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Live Frontend Preview
        </span>
        <span className="text-xs text-slate-500">Updates dynamically</span>
      </div>

      {/* Dynamic Category Banner Preview */}
      <div className="bg-[#111111] p-8 rounded-xl overflow-x-auto border border-slate-800/80">
        <h2 className="text-xl font-bold text-white mb-8 tracking-wide">
          Explore Popular Categories
        </h2>

        <div className="flex items-center gap-6 min-w-max pb-2">
          {categories.map((cat) => {
            const IconComponent = ICON_MAP[cat.icon] || Zap
            const isBeingEdited = cat.id === editingId

            return (
              <div
                key={cat.id}
                className={`flex flex-col items-center gap-3 group cursor-pointer transition-all duration-300 ${
                  isBeingEdited
                    ? "scale-110 ring-2 ring-indigo-500 rounded-2xl p-2 bg-slate-800/50"
                    : "hover:-translate-y-1"
                }`}
              >
                <div
                  className={`w-20 h-20 rounded-full ${cat.bgColor} flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105`}
                >
                  <IconComponent className="w-9 h-9 text-slate-800 stroke-[1.75]" />
                </div>
                <span className="text-sm font-semibold text-slate-200 tracking-tight group-hover:text-white">
                  {cat.name || "Untitled"}
                </span>
              </div>
            )
          })}

          {/* Live Draft Card Preview (When typing a new category) */}
          {!editingId && formData.name && (
            <div className="flex flex-col items-center gap-3 opacity-90 animate-pulse border-2 border-dashed border-indigo-500/50 p-2 rounded-2xl">
              <div
                className={`w-20 h-20 rounded-full ${formData.bgColor} flex items-center justify-center shadow-lg`}
              >
                <DraftIconComponent className="w-9 h-9 text-slate-800 stroke-[1.75]" />
              </div>
              <span className="text-sm font-semibold text-indigo-300">
                {formData.name} (Draft)
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
