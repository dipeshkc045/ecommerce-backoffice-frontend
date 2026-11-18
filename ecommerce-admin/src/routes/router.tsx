import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { DashboardPage } from "@/features/dashboard/dashboard-page"
import { OrdersPage } from "@/features/orders/orders-page"
import { OrderDetailPage } from "@/features/orders/order-detail-page"
import { ProductsPage } from "@/features/products/products-page"
import { ProductDetailPage } from "@/features/products/product-detail-page"
import { PriceApprovalsPage } from "@/features/pricing/price-approvals-page"
import { CashPage } from "@/features/cash/cash-page"

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
      { path: "price-approvals", element: <PriceApprovalsPage /> },
      { path: "cash", element: <CashPage /> },
    ],
  },
])
