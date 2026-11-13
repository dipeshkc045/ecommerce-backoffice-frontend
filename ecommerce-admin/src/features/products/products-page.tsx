import * as React from "react"
import { useNavigate } from "react-router-dom"
import { Plus } from "lucide-react"
import type { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/shared/data-table"
import { ErrorNote, FilterTabs, PageHeader, StatusBadge } from "@/components/shared/page"
import { RequirePermission } from "@/hooks/use-auth"
import { useProducts, type Product } from "./api"
import { NewProductDialog } from "./new-product-dialog"

const FILTERS = [
  { value: "", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PUBLISHED", label: "Published" },
  { value: "UNPUBLISHED", label: "Unpublished" },
]

const columns: ColumnDef<Product>[] = [
  { accessorKey: "name", header: "Product" },
  { accessorKey: "status", header: "Status", cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  {
    id: "skus",
    header: "SKUs",
    cell: ({ row }) => row.original.skus.map((s) => s.sku_code + (s.active ? "" : " (off)")).join(", ") || "—",
  },
]

export function ProductsPage() {
  const [status, setStatus] = React.useState("")
  const [creating, setCreating] = React.useState(false)
  const products = useProducts(status)
  const navigate = useNavigate()

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Products"
        description="Only published products are on the storefront. Open a product to set its price and stock."
        actions={
          <RequirePermission permission="catalog:write">
            <Button onClick={() => setCreating(true)}>
              <Plus /> New product
            </Button>
          </RequirePermission>
        }
      />
      <FilterTabs options={FILTERS} value={status} onChange={setStatus} />
      {products.error ? <ErrorNote error={products.error} /> : null}
      <DataTable
        columns={columns}
        data={products.data?.items ?? []}
        isLoading={products.isLoading}
        emptyMessage="No products here yet."
        onRowClick={(p) => navigate(`/products/${p.id}`)}
      />
      {creating && <NewProductDialog onClose={() => setCreating(false)} onCreated={(p) => navigate(`/products/${p.id}`)} />}
    </div>
  )
}
