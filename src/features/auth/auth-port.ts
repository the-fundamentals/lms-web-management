import type { AuthSession } from '@/features/auth/types'

/**
 * Auth "port" — the only auth API the rest of the app should depend on.
 *
 * UI, route guards, and API clients talk to {@link AuthPort}, not to Cognito or
 * the OIDC client library. The adapter under {@code oidc/} implements this.
 */

/**
 * Listener invoked whenever the signed-in session changes.
 *
 * @param session - current session, or {@code null} if logged out / expired
 */
export type AuthSessionSubscriber = (session: AuthSession | null) => void

/**
 * Contract for authentication (Hosted UI login + tokens).
 */
export interface AuthPort {
  /**
   * Starts login by redirecting the browser to the identity provider.
   *
   * @param returnUrl - optional path to remember for after login
   */
  login: (returnUrl?: string) => Promise<void>

  /**
   * Finishes login on the {@code /callback} route (exchanges code for tokens).
   *
   * @returns the new {@link AuthSession}
   * @throws if the callback URL is invalid or no usable session was created
   */
  handleLoginCallback: () => Promise<AuthSession>

  /**
   * Signs the user out locally, then redirects to the identity provider logout.
   */
  logout: () => Promise<void>

  /**
   * One-shot read of the current session.
   *
   * @returns the session, or {@code null} if missing or expired
   */
  getSession: () => Promise<AuthSession | null>

  /**
   * Access token for API calls ({@code Authorization: Bearer ...}).
   */
  getAccessToken: () => Promise<string | null>

  /**
   * ID token for API calls that need {@code X-ID-Token}.
   */
  getIdToken: () => Promise<string | null>

  /**
   * Whether there is a non-expired local session.
   *
   * Safe for TanStack Router {@code beforeLoad} via {@link getAuth}.
   */
  isAuthenticated: () => Promise<boolean>

  /**
   * Subscribe to session updates (login, logout, token renew).
   *
   * @param subscriber - called with the new session (or {@code null})
   * @returns unsubscribe function — call it on React unmount
   */
  subscribeToSession: (subscriber: AuthSessionSubscriber) => () => void
}
