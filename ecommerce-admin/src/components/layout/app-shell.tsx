import { NavLink, Outlet } from "react-router-dom"
import { Banknote, BadgeCheck, LayoutDashboard, LogOut, PackageSearch, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ErrorNote, Loading } from "@/components/shared/page"
import { cn } from "@/lib/utils"
import { useAuth } from "@/hooks/use-auth"
import type { Permission } from "@/lib/permissions"

interface NavItem {
  to: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  permission: Permission
}

const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, permission: "staff:self" },
  { to: "/orders", label: "Orders", icon: ShoppingCart, permission: "orders:view" },
  { to: "/products", label: "Products", icon: PackageSearch, permission: "catalog:view" },
  { to: "/price-approvals", label: "Price approvals", icon: BadgeCheck, permission: "pricing:write" },
  { to: "/cash", label: "Cash on delivery", icon: Banknote, permission: "payments:view" },
]

export function AppShell() {
  const { user, isLoading, error, signOut } = useAuth()

  if (isLoading) {
    return <div className="p-10"><Loading /></div>
  }
  if (error || !user) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-3 p-10">
        <ErrorNote error={error ?? "You are not signed in"} />
        <Button variant="secondary" onClick={signOut}>Sign out and try again</Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="mb-6 flex items-center gap-2 px-2">
          <div className="flex size-7 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--color-accent)] text-sm font-bold text-white">C</div>
          <span className="text-sm font-semibold">Commerce Admin</span>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.filter((item) => user.permissions.includes(item.permission)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                    : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-ink)]",
                )
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2.5">
          <div className="flex size-8 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-xs font-medium">
            {user.username.slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium">{user.username}</div>
            <div className="truncate text-xs text-[var(--color-ink-faint)]">{user.roles.join(", ").toLowerCase().replace(/_/g, " ") || "no role"}</div>
          </div>
          <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
            <LogOut />
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}
