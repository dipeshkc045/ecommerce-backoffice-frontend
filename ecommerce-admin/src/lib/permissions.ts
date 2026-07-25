/**
 * RBAC model.
 *
 * Deliberately granular (resource:action) rather than coarse roles like
 * "admin" / "editor", because enterprise buyers WILL ask for custom roles
 * ("support staff can view orders but not refund them") and that's much
 * easier to satisfy if permissions are the atomic unit and roles are just
 * named bundles of permissions.
 */
export type Permission =
  | "orders:view"
  | "orders:edit"
  | "orders:refund"
  | "inventory:view"
  | "inventory:edit"
  | "products:view"
  | "products:edit"
  | "customers:view"
  | "customers:edit"
  | "settings:view"
  | "settings:edit"
  | "users:manage"

export type Role = "owner" | "admin" | "support" | "viewer"

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [
    "orders:view", "orders:edit", "orders:refund",
    "inventory:view", "inventory:edit",
    "products:view", "products:edit",
    "customers:view", "customers:edit",
    "settings:view", "settings:edit",
    "users:manage",
  ],
  admin: [
    "orders:view", "orders:edit", "orders:refund",
    "inventory:view", "inventory:edit",
    "products:view", "products:edit",
    "customers:view", "customers:edit",
    "settings:view",
  ],
  support: [
    "orders:view", "orders:edit",
    "products:view",
    "customers:view",
  ],
  viewer: [
    "orders:view", "inventory:view", "products:view", "customers:view",
  ],
}
