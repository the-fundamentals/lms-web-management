/**
 * Public entry point for the auth feature.
 *
 * Prefer importing from here (`@/features/auth`) instead of deep paths.
 *
 * How to navigate this folder:
 * 1. `auth-port.ts` — interface the app depends on
 * 2. `oidc-auth-adapter.ts` — Cognito / oidc-client-ts implementation
 * 3. `create-auth.ts` — `getAuth` singleton for non-React code
 * 4. `AuthContext.tsx` — React bridge: library session → React state
 * 5. `route-guards.ts` — `beforeLoad` helpers
 * 6. `config.ts` / `types.ts` — env config and domain types
 * 7. `components/` / `pages/` — login UI
 *
 * What to use where:
 * - React components → `useAuth` (must be under `AuthProvider`)
 * - Router `beforeLoad` → `requireAuthenticated` / `redirectIfAuthenticated` or `getAuth`
 * - API client → `configureApiClient` (`@/features/api`) uses `getAccessToken()`
 */

export type {
  AuthPort,
  LibrarySessionSubscriber,
} from '@/features/auth/auth-port'
export { AuthProvider, useAuth } from '@/features/auth/AuthContext'
export type { AuthContextValue } from '@/features/auth/AuthContext'
export {
  createAuth,
  getAuth,
  setAuthForTesting,
} from '@/features/auth/create-auth'
export type { AuthConfig } from '@/features/auth/config'
export { loadAuthConfig } from '@/features/auth/config'
export {
  redirectIfAuthenticated,
  requireAuthenticated,
} from '@/features/auth/route-guards'
export type { AuthSession, AuthStatus, AuthUser } from '@/features/auth/types'
export { LoginForm } from '@/features/auth/components/login-form'
export { LoginPage } from '@/features/auth/pages/login-page'
