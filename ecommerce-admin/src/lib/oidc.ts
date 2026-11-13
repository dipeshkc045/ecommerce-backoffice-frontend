/**
 * Staff sign-in with Keycloak (ADR-0023): OpenID Connect Authorization Code flow with PKCE (S256), public client.
 * No password ever passes through this app; Keycloak's own pages handle password and the authenticator code.
 *
 * Tokens: the access token (5 minutes) lives in memory only. The refresh token is kept in sessionStorage so a page
 * reload in the same tab stays signed in; closing the tab signs out. When bff-admin exists it takes over the tokens
 * and the browser only holds an HttpOnly session cookie (ADR-0013).
 */
const ISSUER = import.meta.env.VITE_KEYCLOAK_ISSUER as string
const CLIENT_ID = (import.meta.env.VITE_KEYCLOAK_CLIENT_ID as string) || "backoffice"
const REDIRECT_PATH = "/auth/callback"
const REFRESH_KEY = "staff.refresh_token"
const ID_TOKEN_KEY = "staff.id_token"
const PENDING_KEY = "staff.pending_login"

interface TokenResponse {
  access_token: string
  refresh_token?: string
  id_token?: string
  expires_in: number
}

let accessToken: string | null = null
let accessTokenExpiresAt = 0
let refreshing: Promise<string | null> | null = null

const endpoint = (path: string) => `${ISSUER}/protocol/openid-connect/${path}`
const redirectUri = () => `${window.location.origin}${REDIRECT_PATH}`

function storage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function base64Url(bytes: ArrayBuffer | Uint8Array): string {
  const array = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let text = ""
  array.forEach((b) => (text += String.fromCharCode(b)))
  return btoa(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}

function randomString(): string {
  return base64Url(crypto.getRandomValues(new Uint8Array(32)))
}

/** Sends the browser to Keycloak. {@code returnTo} is where to land after signing in. */
export async function login(returnTo: string = window.location.pathname + window.location.search): Promise<void> {
  const verifier = randomString()
  const state = randomString()
  const challenge = base64Url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)))
  storage()?.setItem(PENDING_KEY, JSON.stringify({ verifier, state, returnTo }))
  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    scope: "openid",
    redirect_uri: redirectUri(),
    code_challenge: challenge,
    code_challenge_method: "S256",
    state,
  })
  window.location.assign(`${endpoint("auth")}?${params}`)
}

/** Finishes sign-in on the callback page. Returns where to go next. Throws if the response does not match our request. */
export async function completeLogin(search: string): Promise<string> {
  const params = new URLSearchParams(search)
  const pending = JSON.parse(storage()?.getItem(PENDING_KEY) ?? "null") as { verifier: string; state: string; returnTo: string } | null
  storage()?.removeItem(PENDING_KEY)
  if (params.get("error")) {
    throw new Error(params.get("error_description") ?? params.get("error") ?? "Sign-in failed")
  }
  if (!pending || params.get("state") !== pending.state || !params.get("code")) {
    throw new Error("This sign-in response does not belong to this browser tab. Please sign in again.")
  }
  await tokenRequest({
    grant_type: "authorization_code",
    code: params.get("code")!,
    redirect_uri: redirectUri(),
    code_verifier: pending.verifier,
  })
  return pending.returnTo.startsWith("/") && !pending.returnTo.startsWith(REDIRECT_PATH) ? pending.returnTo : "/"
}

/** A valid access token, refreshed when it is about to expire; null when nobody is signed in. */
export async function getAccessToken(): Promise<string | null> {
  if (accessToken && Date.now() < accessTokenExpiresAt - 30_000) {
    return accessToken
  }
  const refreshToken = storage()?.getItem(REFRESH_KEY)
  if (!refreshToken) {
    return null
  }
  refreshing ??= tokenRequest({ grant_type: "refresh_token", refresh_token: refreshToken })
    .then(() => accessToken)
    .catch(() => {
      clearTokens()
      return null
    })
    .finally(() => {
      refreshing = null
    })
  return refreshing
}

/** Ends the Keycloak session too, so the next sign-in asks for the password again. */
export function logout(): void {
  const idToken = storage()?.getItem(ID_TOKEN_KEY)
  clearTokens()
  const params = new URLSearchParams({ client_id: CLIENT_ID, post_logout_redirect_uri: `${window.location.origin}/` })
  if (idToken) {
    params.set("id_token_hint", idToken)
  }
  window.location.assign(`${endpoint("logout")}?${params}`)
}

export const isCallbackPath = (path: string) => path === REDIRECT_PATH

function clearTokens() {
  accessToken = null
  accessTokenExpiresAt = 0
  storage()?.removeItem(REFRESH_KEY)
  storage()?.removeItem(ID_TOKEN_KEY)
}

async function tokenRequest(form: Record<string, string>): Promise<void> {
  const res = await fetch(endpoint("token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: CLIENT_ID, ...form }),
  })
  if (!res.ok) {
    throw new Error("Keycloak refused the sign-in (" + res.status + ")")
  }
  const tokens = (await res.json()) as TokenResponse
  accessToken = tokens.access_token
  accessTokenExpiresAt = Date.now() + tokens.expires_in * 1000
  if (tokens.refresh_token) {
    storage()?.setItem(REFRESH_KEY, tokens.refresh_token)
  }
  if (tokens.id_token) {
    storage()?.setItem(ID_TOKEN_KEY, tokens.id_token)
  }
}
