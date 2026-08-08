/**
 * Auth feature — public API only.
 *
 * Prefer `@/features/auth`. OIDC / Cognito wiring lives under `oidc/` and is
 * not for direct app use.
 *
 * - React → `useAuth` / `AuthProvider`
 * - Router `beforeLoad` → `requireAuthenticated` / `getAuth`
 * - Post-login destination → `@/features/account` (`resolvePostLoginPath`)
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
