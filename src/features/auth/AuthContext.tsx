import type { ReactNode } from 'react'
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react'

import type { AuthPort } from '@/features/auth/auth-port'
import { getAuth } from '@/features/auth/create-auth'
import type { AuthSession, AuthStatus } from '@/features/auth/types'

/**
 * Value exposed by {@link AuthProvider} through {@link useAuth}.
 */
export type AuthContextValue = {
  /** Shared auth port (same instance as {@link getAuth}). */
  auth: AuthPort
  /** Current session mirrored into React state, or {@code null}. */
  session: AuthSession | null
  /** High-level UI status derived from session loading. */
  status: AuthStatus
  /** Convenience: {@code status === 'authenticated'}. */
  isAuthenticated: boolean
  /** Start Hosted UI login (redirect). */
  login: AuthPort['login']
  /** Local + IdP logout (redirect). */
  logout: AuthPort['logout']
  /** Finish redirect on {@code /callback}. */
  handleLoginCallback: AuthPort['handleLoginCallback']
  /** Bearer token for API calls. */
  getAccessToken: AuthPort['getAccessToken']
  /** ID token for API calls that need {@code X-ID-Token}. */
  getIdToken: AuthPort['getIdToken']
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Provides auth session state to the React tree.
 *
 * Wrap the app once (e.g. in the root route). Uses {@link getAuth} — it does
 * not create a second auth client.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  useEffect(() => {
    let cancelled = false

    const applySession = (next: AuthSession | null) => {
      if (cancelled) return
      setSession(next)
      setStatus(next ? 'authenticated' : 'unauthenticated')
    }

    void auth.getSession().then(applySession)

    const unsubscribe = auth.subscribeToSession(applySession)

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [auth])

  const value: AuthContextValue = {
    auth,
    session,
    status,
    isAuthenticated: status === 'authenticated',
    login: (returnUrl?: string) => auth.login(returnUrl),
    logout: () => auth.logout(),
    handleLoginCallback: () => auth.handleLoginCallback(),
    getAccessToken: () => auth.getAccessToken(),
    getIdToken: () => auth.getIdToken(),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * React hook for the current auth session and login/logout helpers.
 *
 * Must be used under {@link AuthProvider}. For router {@code beforeLoad} or
 * non-React code, use {@link getAuth} instead.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
