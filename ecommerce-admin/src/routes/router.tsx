import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { DashboardPage } from "@/features/dashboard/dashboard-page"
import { OrdersPage } from "@/features/orders/orders-page"
import { OrderDetailPage } from "@/features/orders/order-detail-page"
import { ProductsPage } from "@/features/products/products-page"
import { ProductDetailPage } from "@/features/products/product-detail-page"
import { PriceApprovalsPage } from "@/features/pricing/price-approvals-page"
import { CashPage } from "@/features/cash/cash-page"
import { CategoriesPage } from "@/features/catalog/categories-page"
import { BrandsPage } from "@/features/catalog/brands-page"
import { AttributesPage } from "@/features/catalog/attributes-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "orders/:id", element: <OrderDetailPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "products/:id", element: <ProductDetailPage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "brands", element: <BrandsPage /> },
      { path: "attributes", element: <AttributesPage /> },
      { path: "price-approvals", element: <PriceApprovalsPage /> },
      { path: "cash", element: <CashPage /> },
    ],
  },
])
