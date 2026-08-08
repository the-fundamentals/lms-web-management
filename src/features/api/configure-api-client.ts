import { client } from '@the-fundamentals/core-openapi/client'

import { getAuth } from '@/features/auth'

let configured = false

/**
 * Wires the shared OpenAPI client once: API base URL + bearer access token.
 *
 * Call early (e.g. from {@code getRouter}) before any SDK / React Query helpers
 * read {@code baseUrl} into query keys. Pass {@code X-ID-Token} only on calls
 * that require it (e.g. {@code updateMyAccountProfile}).
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
