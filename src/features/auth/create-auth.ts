import type { AuthPort } from '@/features/auth/auth-port'
import { createOidcAuthAdapter } from '@/features/auth/oidc/adapter'
import { loadAuthConfig } from '@/features/auth/oidc/config'

/**
 * Module-level singleton. One {@link AuthPort} shared by React, route guards,
 * and the API client.
 */
let authPort: AuthPort | null = null

/**
 * Builds a new OIDC-backed {@link AuthPort} from env config.
 *
 * Prefer {@link getAuth} in app code so everyone shares one instance.
 */
export function createAuth(): AuthPort {
  return createOidcAuthAdapter(loadAuthConfig())
}

/**
 * Returns the process-wide {@link AuthPort}, creating it on first use.
 *
 * Use from TanStack Router {@code beforeLoad}, the API client, and
 * {@link AuthProvider} — not a second OIDC client.
 */
export function getAuth(): AuthPort {
  if (!authPort) {
    authPort = createAuth()
  }
  return authPort
}

/**
 * Replaces or clears the singleton. Tests only — do not call from app UI.
 */
export function setAuthForTesting(port: AuthPort | null): void {
  authPort = port
}
