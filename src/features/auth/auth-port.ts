import type { AuthSession } from '@/features/auth/types'

/**
 * Auth "port" (interface) — the only auth API the rest of the app should depend on.
 *
 * <p>Think of this like a Spring port: UI, route guards, and API clients talk to
 * {@link AuthPort}, not to Cognito or {@code oidc-client-ts} directly. The OIDC adapter
 * implements this interface.
 *
 * <h2>Typical flows</h2>
 * <ul>
 *   <li>Login button → {@link AuthPort.login} → Cognito Hosted UI (browser redirect)</li>
 *   <li>{@code /callback} → {@link AuthPort.handleLoginCallback} → tokens in localStorage</li>
 *   <li>Route {@code beforeLoad} → {@link AuthPort.isAuthenticated}</li>
 *   <li>React UI → subscribe via {@link AuthPort.subscribeToLibrarySession} (see AuthProvider)</li>
 * </ul>
 */

/**
 * Listener invoked whenever the imperative OIDC library's session changes.
 *
 * @param session - current session, or {@code null} if logged out / expired
 */
export type LibrarySessionSubscriber = (
  session: AuthSession | null,
) => void

/**
 * Contract for authentication against Cognito (Hosted UI + PKCE).
 */
export interface AuthPort {
  /**
   * Starts login by redirecting the browser to Cognito Hosted UI.
   *
   * <p>Does not return normally in the success path — the page navigates away.
   * After the user signs in, Cognito sends them to {@code /callback}.
   *
   * @param returnUrl - optional path to remember for after login (stored in OIDC state)
   */
  login(returnUrl?: string): Promise<void>

  /**
   * Finishes login on the {@code /callback} route.
   *
   * <p>Exchanges the authorization {@code code} from the URL for tokens and stores
   * them (via oidc-client-ts, typically in {@code localStorage}).
   *
   * @returns the new {@link AuthSession}
   * @throws if the callback URL is invalid or no usable session was created
   */
  handleLoginCallback(): Promise<AuthSession>

  /**
   * Signs the user out locally, then redirects to Cognito logout.
   *
   * <p>Clears the local OIDC user, notifies subscribers with {@code null}, then
   * sends the browser to Cognito's {@code /logout} so the Hosted UI session ends too.
   */
  logout(): Promise<void>

  /**
   * One-shot read of the current session from the OIDC library / storage.
   *
   * @returns the session, or {@code null} if missing or expired
   */
  getSession(): Promise<AuthSession | null>

  /**
   * Access token for calling the API ({@code Authorization: Bearer ...}).
   *
   * @returns the token string, or {@code null} if not signed in
   */
  getAccessToken(): Promise<string | null>

  /**
   * ID token (needed by some API endpoints as {@code X-ID-Token}).
   *
   * @returns the token string, or {@code null} if not signed in
   */
  getIdToken(): Promise<string | null>

  /**
   * Whether there is a non-expired local session.
   *
   * <p>Safe for TanStack Router {@code beforeLoad} via {@link getAuth}.
   */
  isAuthenticated(): Promise<boolean>

  /**
   * Subscribe to session updates from the imperative OIDC library.
   *
   * <p>OIDC is not React: when the user loads, unloads, or token renew fails, the
   * library fires events. This method registers your callback so you can copy that
   * into React state (see {@code AuthProvider}).
   *
   * @param subscriber - called with the new session (or {@code null})
   * @returns unsubscribe function — call it on React unmount
   */
  subscribeToLibrarySession(
    subscriber: LibrarySessionSubscriber,
  ): () => void
}
