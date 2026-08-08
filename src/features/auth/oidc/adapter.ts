import {
  UserManager,
  WebStorageStateStore,
} from 'oidc-client-ts'
import type { User, UserManagerSettings } from 'oidc-client-ts'

import type {
  AuthPort,
  AuthSessionSubscriber,
} from '@/features/auth/auth-port'
import type { AuthConfig } from '@/features/auth/oidc/config'
import {
  getAuthority,
  getHostedUiBaseUrl,
} from '@/features/auth/oidc/config'
import type { AuthSession, AuthUser } from '@/features/auth/types'

/**
 * Cognito Hosted UI implementation of {@link AuthPort} using {@code oidc-client-ts}.
 *
 * App code must not import this — use {@link getAuth} / {@link useAuth} instead.
 */

function toAuthUser(user: User): AuthUser {
  const profile = user.profile
  const groupsClaim = profile['cognito:groups']
  const groups = Array.isArray(groupsClaim)
    ? groupsClaim.filter((g): g is string => typeof g === 'string')
    : typeof groupsClaim === 'string'
      ? [groupsClaim]
      : []

  return {
    sub: profile.sub,
    email: typeof profile.email === 'string' ? profile.email : null,
    groups,
  }
}

function toAuthSession(user: User | null): AuthSession | null {
  if (!user || user.expired) {
    return null
  }
  return { user: toAuthUser(user) }
}

function buildUserManagerSettings(config: AuthConfig): UserManagerSettings {
  const hostedUi = getHostedUiBaseUrl(config)

  return {
    authority: getAuthority(config),
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    post_logout_redirect_uri: config.logoutUri,
    response_type: 'code',
    scope: 'openid email profile',
    automaticSilentRenew: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
    metadata: {
      issuer: getAuthority(config),
      authorization_endpoint: `${hostedUi}/oauth2/authorize`,
      token_endpoint: `${hostedUi}/oauth2/token`,
      userinfo_endpoint: `${hostedUi}/oauth2/userInfo`,
      jwks_uri: `${getAuthority(config)}/.well-known/jwks.json`,
      // Cognito Hosted UI logout is non-standard; adapter handles logout manually.
      end_session_endpoint: `${hostedUi}/logout`,
    },
  }
}

/**
 * Creates an {@link AuthPort} backed by Cognito + {@code oidc-client-ts}.
 *
 * {@link UserManager} is created lazily on first browser use so SSR does not
 * touch {@code window} / {@code localStorage}.
 */
export function createOidcAuthAdapter(config: AuthConfig): AuthPort {
  let userManager: UserManager | null = null
  let oidcEventsWired = false

  const sessionSubscribers = new Set<AuthSessionSubscriber>()

  const publishSession = (session: AuthSession | null) => {
    for (const subscriber of sessionSubscribers) {
      subscriber(session)
    }
  }

  const forwardOidcUser = (user: User | null) => {
    publishSession(toAuthSession(user))
  }

  const getUserManager = (): UserManager => {
    if (typeof window === 'undefined') {
      throw new Error('Auth is only available in the browser')
    }
    if (!userManager) {
      userManager = new UserManager(buildUserManagerSettings(config))
    }
    if (!oidcEventsWired) {
      oidcEventsWired = true
      userManager.events.addUserLoaded((user) => {
        forwardOidcUser(user)
      })
      userManager.events.addUserUnloaded(() => {
        forwardOidcUser(null)
      })
      userManager.events.addAccessTokenExpired(() => {
        void userManager!.getUser().then(forwardOidcUser)
      })
      userManager.events.addSilentRenewError(() => {
        forwardOidcUser(null)
      })
    }
    return userManager
  }

  const getValidUser = async (): Promise<User | null> => {
    const user = await getUserManager().getUser()
    if (!user || user.expired) {
      return null
    }
    return user
  }

  return {
    async login(returnUrl?: string): Promise<void> {
      await getUserManager().signinRedirect({
        state: returnUrl ? { returnUrl } : undefined,
      })
    },

    async handleLoginCallback(): Promise<AuthSession> {
      const user = await getUserManager().signinRedirectCallback()
      const session = toAuthSession(user)
      if (!session) {
        throw new Error('OIDC callback completed without a valid session')
      }
      publishSession(session)
      return session
    },

    async logout(): Promise<void> {
      await getUserManager().removeUser()
      publishSession(null)

      const hostedUi = getHostedUiBaseUrl(config)
      const logoutUrl = new URL(`${hostedUi}/logout`)
      logoutUrl.searchParams.set('client_id', config.clientId)
      logoutUrl.searchParams.set('logout_uri', config.logoutUri)
      window.location.assign(logoutUrl.toString())
    },

    async getSession(): Promise<AuthSession | null> {
      return toAuthSession(await getValidUser())
    },

    async getAccessToken(): Promise<string | null> {
      const user = await getValidUser()
      return user?.access_token ?? null
    },

    async getIdToken(): Promise<string | null> {
      const user = await getValidUser()
      return user?.id_token ?? null
    },

    async isAuthenticated(): Promise<boolean> {
      return (await getValidUser()) !== null
    },

    subscribeToSession(subscriber: AuthSessionSubscriber): () => void {
      sessionSubscribers.add(subscriber)
      return () => {
        sessionSubscribers.delete(subscriber)
      }
    },
  }
}
