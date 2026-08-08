import type { AuthPort } from '@/features/auth/auth-port'
import { loadAuthConfig } from '@/features/auth/config'
import { createOidcAuthAdapter } from '@/features/auth/oidc-auth-adapter'

/**
 * Module-level singleton. One {@link AuthPort} shared by React, route guards, and
 * the API client — same idea as a single Spring bean, but looked up via
 * {@link getAuth} because TanStack {@code beforeLoad} cannot use React Context.
 */
let authPort: AuthPort | null = null

/**
 * Builds a new OIDC-backed {@link AuthPort} from env config.
 *
 * <p>Prefer {@link getAuth} in app code so everyone shares one instance.
 *
 * @returns a fresh Cognito OIDC adapter
 */
export function createAuth(): AuthPort {
  return createOidcAuthAdapter(loadAuthConfig())
}

/**
 * Returns the process-wide {@link AuthPort}, creating it on first use.
 *
 * <p><b>Use this</b> from:
 * <ul>
 *   <li>TanStack Router {@code beforeLoad} (no React hooks there)</li>
 *   <li>API clients that need tokens</li>
 *   <li>{@link AuthProvider} (it must not create a second instance)</li>
 * </ul>
 *
 * @returns the shared auth port
 */
export function getAuth(): AuthPort {
  if (!authPort) {
    authPort = createAuth()
  }
  return authPort
}

/**
 * Replaces or clears the singleton. <b>Tests only</b> — do not call from app UI.
 *
 * @param port - mock/fake port, or {@code null} to reset
 */
export function setAuthForTesting(port: AuthPort | null): void {
  authPort = port
}
