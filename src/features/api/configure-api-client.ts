import { client } from '@the-fundamentals/core-openapi/client'

import { getAuth } from '@/features/auth'

let configured = false

/**
 * Wires the shared OpenAPI client once: API base URL + access token for every
 * secured request.
 *
 * <p>Uses {@link client.setConfig} from {@code @the-fundamentals/core-openapi}.
 * {@code auth} is a callback so each request resolves the current Cognito
 * access token (login, renew, logout) instead of a stale string.
 *
 * <p>Call early (e.g. from {@code getRouter}) before any SDK / React Query
 * helpers read {@code baseUrl} into query keys.
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
}
