/**
 * Auth feature — public API only.
 *
 * Prefer `@/features/auth`. OIDC / Cognito wiring lives under `oidc/` and is
 * not for direct app use.
 *
 * - React → `useAuth` / `AuthProvider`
 * - Router `beforeLoad` → `requireAuthenticated` / `redirectIfAuthenticated` / `getAuth`
 * - API client → `getAuth().getAccessToken()` (via `@/features/api`)
 * - Login UI → `LoginPage`
 */

export type { AuthPort } from '@/features/auth/auth-port'
export { AuthProvider, useAuth } from '@/features/auth/AuthContext'
export type { AuthContextValue } from '@/features/auth/AuthContext'
export { getAuth } from '@/features/auth/create-auth'
export {
  redirectIfAuthenticated,
  requireAuthenticated,
} from '@/features/auth/route-guards'
export type { AuthSession, AuthStatus, AuthUser } from '@/features/auth/types'
export { LoginPage } from '@/features/auth/pages/login-page'
