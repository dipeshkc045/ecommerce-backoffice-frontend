import * as React from "react"
import { ROLE_PERMISSIONS, type Permission, type Role } from "@/lib/permissions"

export interface CurrentUser {
  id: string
  name: string
  email: string
  role: Role
}

interface AuthContextValue {
  user: CurrentUser | null
  isLoading: boolean
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  isLoading: true,
})

/**
 * Replace this with your real auth fetch (session cookie check, token
 * refresh, whatever the backend team lands on). Keeping it isolated here
 * means the rest of the app never talks to auth internals directly.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    // TODO: replace with real session/me endpoint call
    const mockUser: CurrentUser = {
      id: "u_1",
      name: "Alex Rivera",
      email: "alex@company.com",
      role: "admin",
    }
    const timer = setTimeout(() => {
      setUser(mockUser)
      setIsLoading(false)
    }, 200)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return React.useContext(AuthContext)
}

/** Usage: const canEditOrders = usePermission("orders:edit") */
export function usePermission(permission: Permission): boolean {
  const { user } = useAuth()
  if (!user) return false
  return ROLE_PERMISSIONS[user.role].includes(permission)
}

/** Usage: <RequirePermission permission="orders:refund">...</RequirePermission> */
export function RequirePermission({
  permission,
  fallback = null,
  children,
}: {
  permission: Permission
  fallback?: React.ReactNode
  children: React.ReactNode
}) {
  const allowed = usePermission(permission)
  return <>{allowed ? children : fallback}</>
}
