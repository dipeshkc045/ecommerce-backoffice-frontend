import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { RouterProvider } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "@/hooks/use-auth"
import { CallbackPage } from "@/features/auth/callback-page"
import { isCallbackPath } from "@/lib/oidc"
import { ApiError } from "@/lib/api-client"
import { router } from "@/routes/router"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      // Retrying a refusal (4xx) cannot help; retry only network trouble and server errors, once
      retry: (count, error) => count < 1 && !(error instanceof ApiError && error.status < 500),
    },
  },
})

export default function App() {
  // The sign-in callback runs before anything that needs a signed-in user
  if (isCallbackPath(window.location.pathname)) {
    return <CallbackPage />
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </QueryClientProvider>
  )
}
