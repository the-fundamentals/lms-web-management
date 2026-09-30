import { client } from '@the-fundamentals/core-openapi/client'

import { getAuth } from '@/features/auth'

let configured = false

/** Consecutive API 401s before treating the session as dead and sending the user to login. */
const UNAUTHORIZED_REDIRECT_THRESHOLD = 3

let consecutiveUnauthorized = 0
let reauthInFlight = false

/**
 * Clears local auth and returns the user to the login page.
 *
 * Uses IdP logout when possible so Cognito cookies are cleared too; falls back
 * to a hard navigation to `/` if logout itself fails.
 */
async function redirectToLogin(): Promise<void> {
  if (typeof window === 'undefined') {
    return
  }
  try {
    await getAuth().logout()
  } catch {
    window.location.assign('/')
  }
}

function handleUnauthorizedResponse(): void {
  consecutiveUnauthorized += 1
  if (
    consecutiveUnauthorized < UNAUTHORIZED_REDIRECT_THRESHOLD ||
    reauthInFlight
  ) {
    return
  }
  reauthInFlight = true
  consecutiveUnauthorized = 0
  void redirectToLogin().finally(() => {
    reauthInFlight = false
  })
}

/**
 * Wires the shared OpenAPI client once: API base URL + bearer access token.
 *
 * Call early (e.g. from {@code getRouter}) before any SDK / React Query helpers
 * read {@code baseUrl} into query keys. Pass {@code X-ID-Token} only on calls
 * that require it (e.g. {@code updateMyAccountProfile}).
 *
 * Also watches responses: {@link UNAUTHORIZED_REDIRECT_THRESHOLD} consecutive
 * 401s → logout + login page (session no longer accepted by the API).
 */
export function configureApiClient(): void {
  if (configured) return
  configured = true

  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new Error('Missing required env var: VITE_API_BASE_URL')
  }

  client.setConfig({
    baseUrl,
    auth: async () => (await getAuth().getAccessToken()) ?? undefined,
  })

  client.interceptors.response.use((response) => {
    if (response.status === 401) {
      handleUnauthorizedResponse()
    } else if (response.ok) {
      consecutiveUnauthorized = 0
    }
    return response
  })
}
