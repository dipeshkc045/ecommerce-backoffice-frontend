import { getAccessToken, login } from "@/lib/oidc"

/**
 * Single chokepoint for all HTTP calls to the platform's admin API (/admin/v1/**). Feature code never calls fetch()
 * directly. Every call carries the staff access token; JSON is snake_case both ways (doc 06 §1).
 */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? ""

/** An error answer from the platform: HTTP status, the machine-readable `code`, and the readable `detail`. */
export class ApiError extends Error {
  status: number
  code: string
  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
    this.name = "ApiError"
  }
}

export interface RequestOptions {
  headers?: Record<string, string>
}

export interface ApiResponse<T> {
  data: T
  etag: string | null
}

async function request<T>(method: string, path: string, body?: unknown, options?: RequestOptions): Promise<ApiResponse<T>> {
  const token = await getAccessToken()
  if (!token) {
    await login()
    throw new ApiError(401, "unauthenticated", "Signing in…")
  }
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Accept: "application/json",
      ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      Authorization: `Bearer ${token}`,
      ...options?.headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 401) {
    await login()
    throw new ApiError(401, "unauthenticated", "Your session ended. Signing in again…")
  }
  if (!res.ok) {
    let code = "http_" + res.status
    let detail = res.statusText || "Request failed"
    try {
      const problem = (await res.json()) as { code?: string; detail?: string; title?: string }
      code = problem.code ?? code
      detail = problem.detail ?? problem.title ?? detail
    } catch {
      // not a problem+json body
    }
    throw new ApiError(res.status, code, detail)
  }
  const data = res.status === 204 ? (undefined as T) : ((await res.json()) as T)
  return { data, etag: res.headers.get("ETag") }
}

export const apiClient = {
  get: <T,>(path: string, options?: RequestOptions) => request<T>("GET", path, undefined, options).then((r) => r.data),
  post: <T,>(path: string, body?: unknown, options?: RequestOptions) => request<T>("POST", path, body ?? {}, options).then((r) => r.data),
  put: <T,>(path: string, body?: unknown, options?: RequestOptions) => request<T>("PUT", path, body, options).then((r) => r.data),
  delete: <T,>(path: string, options?: RequestOptions) => request<T>("DELETE", path, undefined, options).then((r) => r.data),
  /** For endpoints whose ETag the caller needs (optimistic locking with If-Match). */
  raw: request,
}

/** A new key per user action (not per retry): the platform answers a repeat of the same key with the first result. */
export const newIdempotencyKey = () => crypto.randomUUID()

/** Friendly text for any error a mutation or query throws. */
export function errorText(error: unknown): string {
  if (error instanceof ApiError) return error.message
  if (error instanceof Error) return error.message
  return "Something went wrong"
}
