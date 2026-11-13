import * as React from "react"
import { apiClient } from "@/lib/api-client"
import { getAccessToken, login, logout } from "@/lib/oidc"
import type { Permission } from "@/lib/permissions"

/** The signed-in staff member, as GET /admin/v1/me describes them. */
export interface CurrentUser {
  subject: string
  username: string
  roles: string[]
  permissions: string[]
}

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
  error: string | null
  signOut: () => void
}

const AuthContext = React.createContext<AuthContextValue>({ user: null, isLoading: true, error: null, signOut: () => {} })

/** Signs in through Keycloak when needed, then asks the platform who this is and what they may do. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let cancelled = false
    ;(async () => {
      if (!(await getAccessToken())) {
        await login()
        return
      }
      try {
        const me = await apiClient.get<CurrentUser>("/admin/v1/me")
        if (!cancelled) setUser(me)
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not load your account")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return <AuthContext.Provider value={{ user, isLoading, error, signOut: logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return React.useContext(AuthContext)
}

/** Usage: const canShip = usePermission("orders:fulfil") */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  return !!user && user.permissions.includes(permission)
}

/** Usage: <RequirePermission permission="pricing:write">…</RequirePermission> */
export function RequirePermission({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  return <>{usePermission(permission) ? children : fallback}</>
}
