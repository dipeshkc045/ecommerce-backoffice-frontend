# Commerce Admin — Enterprise Admin Panel Starter

## Stack

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** — CSS-based theme tokens in `src/index.css`, no config file needed
- **shadcn-style components** on **Radix UI primitives** — hand-authored in `src/components/ui`
  (the shadcn CLI registry isn't reachable from this sandbox, so components were written directly;
  they follow the exact shadcn pattern — `npx shadcn@latest add <component>` will work fine in your
  own environment and slot in the same way)
- **TanStack Query** — server state, caching, mutations
- **TanStack Table** — the `DataTable` component in `src/components/shared/data-table.tsx`
- **React Hook Form + Zod** — installed, ready for forms (not yet wired into a screen)
- **React Router v6** — routing, in `src/routes/router.tsx`
- **Zustand** — installed for client-only state, use sparingly
- **Recharts** — installed for the dashboard, not yet wired
- **Sonner** — toast notifications

## Getting started

```bash
npm install
npm run dev
```

## Architecture

```
src/
  components/
    ui/          shadcn-style primitives (button, card, input, badge, ...)
    shared/       reusable composed components (DataTable)
    layout/       app shell, sidebar
  features/
    orders/        types.ts, api.ts, columns.tsx, orders-page.tsx  <- reference feature
    dashboard/
  hooks/
    use-auth.tsx  auth context + usePermission() + <RequirePermission>
  lib/
    api-client.ts  single fetch chokepoint - swap base URL/auth here only
    permissions.ts RBAC model (resource:action permissions, bundled into roles)
    utils.ts        cn() className helper
  routes/
    router.tsx
```

## Adding a new feature (e.g. Inventory)

Copy the `orders/` folder as your template:

1. `types.ts` — domain types
2. `api.ts` — TanStack Query hooks (`useX`, `useUpdateX`), mock data until backend exists
3. `columns.tsx` — TanStack Table column defs
4. `x-page.tsx` — page composing `<DataTable>` + filters
5. Register the route in `src/routes/router.tsx`
6. Add the nav item + required permission in `src/components/layout/app-shell.tsx`

## RBAC

Permissions are granular (`orders:refund`, `settings:edit`, etc.), bundled into roles in
`src/lib/permissions.ts`. Gate UI with:

```tsx
const canRefund = usePermission("orders:refund")
// or
<RequirePermission permission="orders:refund">
  <RefundButton />
</RequirePermission>
```

Gate this at the API layer too — client-side checks are UX, not security.

## Before this goes to production

- [ ] Replace the mock auth in `use-auth.tsx` with your real session/auth flow
- [ ] Replace mock data in `features/orders/api.ts` with real `apiClient` calls
- [ ] Set `VITE_API_BASE_URL` in `.env`
- [ ] Add error boundaries and a global error toast handler
- [ ] Add tests (Vitest + Testing Library recommended, not yet installed)
- [ ] Decide on i18n now if you'll need it (`react-i18next`) — much cheaper to add early
