/**
 * Single chokepoint for all HTTP calls. When the backend team gives you
 * the real base URL / auth scheme, this is the only file that changes —
 * feature code never calls fetch() directly.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL
export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}

/** Standard envelope returned by the backend for every response. */
export interface ApiEnvelope<T> {
  success: boolean
  message: string
  data: T
  timestamp: string
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    credentials: "include",
  })

  if (!res.ok) {
    const body = await res.text().catch(() => "")
    throw new ApiError(res.status, body || res.statusText)
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

/**
 * Unwrap the standard `{ success, message, data }` envelope.
 * Use this when calling endpoints that return the envelope directly.
 */
export function unwrap<T>(envelope: ApiEnvelope<T>): T {
  if (!envelope.success) {
    throw new Error(envelope.message ?? "Request failed")
  }
  return envelope.data
}

export const apiClient = {
  get: <T,>(path: string) => request<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  patch: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  put: <T,>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T,>(path: string) => request<T>(path, { method: "DELETE" }),
}

