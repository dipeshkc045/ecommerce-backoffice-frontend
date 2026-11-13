/**
 * Staff permissions as the platform names them (ADR-0023). They come from GET /admin/v1/me, decided on the server
 * from the person's Keycloak roles; the app only uses them to show or hide screens and buttons. The server checks
 * every call again, so hiding a button is a convenience, not the protection.
 */
export type Permission =
  | "staff:self"
  | "catalog:view"
  | "catalog:write"
  | "pricing:write"
  | "inventory:view"
  | "inventory:write"
  | "orders:view"
  | "orders:fulfil"
  | "payments:view"
  | "payments:collect"
  | "customers:view"
  | "audit:view"
