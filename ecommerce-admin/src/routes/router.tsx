import { createBrowserRouter } from "react-router-dom"
import { AppShell } from "@/components/layout/app-shell"
import { DashboardPage } from "@/features/dashboard/dashboard-page"
import { OrdersPage } from "@/features/orders/orders-page"
import { InventoryPage } from "@/features/inventory/inventory-page"
import { ProductsPage } from "@/features/products/products-page"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "orders", element: <OrdersPage /> },
      { path: "products", element: <ProductsPage /> },
      { path: "inventory", element: <InventoryPage /> },
    ],
  },
])
