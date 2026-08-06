import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'

import type { AuthPort } from '@/features/auth/auth-port'
import { getAuth } from '@/features/auth/create-auth'
import type { AuthSession, AuthStatus } from '@/features/auth/types'

/**
 * Value exposed by {@link AuthProvider} through {@link useAuth}.
 *
 * <p>Combines a live React projection of the session with imperative methods
 * that delegate to the shared {@link AuthPort}.
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
  /** Start Cognito Hosted UI login (redirect). */
  login: AuthPort['login']
  /** Local + Cognito logout (redirect). */
  logout: AuthPort['logout']
  /** Finish OIDC redirect on {@code /callback}. */
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
 * <p>Wrap the app once (e.g. in the root route). Internally uses {@link getAuth}
 * — it does <em>not</em> create a second OIDC client.
 *
 * <p>On mount it seeds React state from the library, then subscribes so login,
 * logout, and token renew update components automatically.
 *
 * @param children - app UI that may call {@link useAuth}
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = getAuth()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  // On mount: copy the current OIDC session into React state, then subscribe so later
  // login/logout/token-renew events from the library keep that React state updated.
  // On unmount: stop listening and ignore any late async result.
  useEffect(() => {
    let cancelled = false

    const applyLibrarySessionToReactState = (
      next: AuthSession | null,
    ) => {
      if (cancelled) return
      setSession(next)
      setStatus(next ? 'authenticated' : 'unauthenticated')
    }

    void auth.getSession().then(applyLibrarySessionToReactState)

    const unsubscribeFromLibrarySession = auth.subscribeToLibrarySession(
      applyLibrarySessionToReactState,
    )

    return () => {
      cancelled = true
      unsubscribeFromLibrarySession()
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
 * <p>Must be used under {@link AuthProvider}. For router {@code beforeLoad} or
 * non-React code, use {@link getAuth} instead.
 *
 * @returns current {@link AuthContextValue}
 * @throws if called outside {@link AuthProvider}
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
