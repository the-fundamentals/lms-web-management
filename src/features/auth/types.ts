/**
 * Domain types for the management-web auth feature.
 *
 * <p>These are our app-facing shapes (not raw oidc-client-ts types). The OIDC adapter
 * maps Cognito/OIDC users into {@link AuthSession} before the rest of the app sees them.
 */

/**
 * The signed-in person, derived from the Cognito ID token claims.
 */
export type AuthUser = {
  /** Cognito user id (`sub` claim). */
  sub: string
  /** Email from the token, if present. */
  email: string | null
  /** Cognito groups (e.g. `ADMIN`, `USER`) from the `cognito:groups` claim. */
  groups: string[]
}

/**
 * A valid signed-in session for this app.
 *
 * <p>{@code null} elsewhere means "no session" (logged out or expired).
 */
export type AuthSession = {
  user: AuthUser
}

/**
 * React-facing auth lifecycle for {@link AuthProvider} / {@link useAuth}.
 *
 * <ul>
 *   <li>{@code loading} — we have not finished reading the library session yet</li>
 *   <li>{@code authenticated} — we have a non-expired session</li>
 *   <li>{@code unauthenticated} — no session</li>
 * </ul>
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
