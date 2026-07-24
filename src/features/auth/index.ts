/**
 * Public entry point for the auth feature.
 *
 * <p><b>Prefer importing from here</b> ({@code #/features/auth}) instead of deep paths.
 *
 * <h2>How to navigate this folder</h2>
 * <ol>
 *   <li>{@code auth-port.ts} — interface the app depends on (like a Spring port)</li>
 *   <li>{@code oidc-auth-adapter.ts} — Cognito / oidc-client-ts implementation</li>
 *   <li>{@code create-auth.ts} — {@link getAuth} singleton for non-React code</li>
 *   <li>{@code AuthContext.tsx} — React bridge: library session → React state</li>
 *   <li>{@code route-guards.ts} — {@code beforeLoad} helpers</li>
 *   <li>{@code config.ts} / {@code types.ts} — env config and domain types</li>
 * </ol>
 *
 * <h2>What to use where</h2>
 * <ul>
 *   <li>React components → {@link useAuth} (must be under {@link AuthProvider})</li>
 *   <li>Router {@code beforeLoad} → {@link requireAuthenticated} / {@link redirectIfAuthenticated}
 *       or {@link getAuth}</li>
 *   <li>API client (later) → {@link getAuth}{@code .getAccessToken()} / {@code getIdToken()}</li>
 * </ul>
 */

export type {
  AuthPort,
  LibrarySessionSubscriber,
} from '#/features/auth/auth-port'
export { AuthProvider, useAuth } from '#/features/auth/AuthContext'
export type { AuthContextValue } from '#/features/auth/AuthContext'
export {
  createAuth,
  getAuth,
  setAuthForTesting,
} from '#/features/auth/create-auth'
export type { AuthConfig } from '#/features/auth/config'
export { loadAuthConfig } from '#/features/auth/config'
export {
  redirectIfAuthenticated,
  requireAuthenticated,
} from '#/features/auth/route-guards'
export type { AuthSession, AuthStatus, AuthUser } from '#/features/auth/types'
