import { NavLink, Outlet } from "react-router-dom"
import { LayoutDashboard, ShoppingCart, Package, PackageSearch, Users, Settings } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth, usePermission } from "@/hooks/use-auth"
import type { Permission } from "@/lib/permissions"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission?: Permission
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/orders", label: "Orders", icon: ShoppingCart, permission: "orders:view" },
  { to: "/products", label: "Products", icon: PackageSearch, permission: "products:view" },
  { to: "/inventory", label: "Inventory", icon: Package, permission: "inventory:view" },
  { to: "/customers", label: "Customers", icon: Users, permission: "customers:view" },
  { to: "/settings", label: "Settings", icon: Settings, permission: "settings:view" },
]

function NavItemLink({ item }: { item: NavItem }) {
  // Hooks can't be called conditionally, so we always call usePermission —
  // it safely returns true when no permission is required.
  const allowed = usePermission(item.permission ?? ("orders:view" as Permission))
  const visible = !item.permission || allowed
  if (!visible) return null

  const Icon = item.icon
  return (
    <NavLink
      to={item.to}
      end={item.to === "/"}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
            : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]"
        )
      }
    >
      <Icon className="size-4" />
      {item.label}
    </NavLink>
  )
}

export function AppShell() {
  const { user } = useAuth()

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-bold text-white">
            C
          </div>
          <span className="text-sm font-semibold">Commerce Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <NavItemLink key={item.to} item={item} />
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-xs font-medium">
            {user?.name?.slice(0, 1) ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="truncate text-xs font-medium">{user?.name ?? "Loading…"}</div>
            <div className="truncate text-xs text-[var(--color-ink-faint)] capitalize">{user?.role}</div>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  )
}
