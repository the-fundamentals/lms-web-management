/**
 * App-facing auth types (not OIDC library shapes).
 */

/** The signed-in person, derived from ID token claims. */
export type AuthUser = {
  /** User id (`sub` claim). */
  sub: string
  /** Email from the token, if present. */
  email: string | null
  /** Groups (e.g. `ADMIN`, `USER`). */
  groups: string[]
}

/** A valid signed-in session. {@code null} elsewhere means logged out / expired. */
export type AuthSession = {
  user: AuthUser
}

/**
 * React-facing auth lifecycle for {@link AuthProvider} / {@link useAuth}.
 *
 * - `loading` — session not read yet
 * - `authenticated` — non-expired session
 * - `unauthenticated` — no session
 */
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'
