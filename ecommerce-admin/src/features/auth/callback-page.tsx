import * as React from "react"
import { Button } from "@/components/ui/button"
import { completeLogin, login } from "@/lib/oidc"

/** Keycloak sends the browser back here with a one-time code; exchange it and continue where the person was going. */
export function CallbackPage() {
  const [error, setError] = React.useState<string | null>(null)
  const started = React.useRef(false)

  React.useEffect(() => {
    if (started.current) return // StrictMode runs effects twice; the code can be used only once
    started.current = true
    completeLogin(window.location.search)
      .then((next) => window.location.replace(next))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Sign-in failed"))
  }, [])

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      {error ? (
        <div className="flex max-w-sm flex-col items-center gap-3 text-center">
          <p className="text-sm text-[var(--color-danger)]">{error}</p>
          <Button onClick={() => login("/")}>Sign in again</Button>
        </div>
      ) : (
        <p className="text-sm text-[var(--color-ink-muted)]">Signing you in…</p>
      )}
    </div>
  )
}
