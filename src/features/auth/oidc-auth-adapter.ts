import {
  User,
  UserManager,
  WebStorageStateStore,
  type UserManagerSettings,
} from 'oidc-client-ts'

import type {
  AuthPort,
  LibrarySessionSubscriber,
} from '#/features/auth/auth-port'
import {
  getAuthority,
  getHostedUiBaseUrl,
  type AuthConfig,
} from '#/features/auth/config'
import type { AuthSession, AuthUser } from '#/features/auth/types'

/**
 * Cognito Hosted UI implementation of {@link AuthPort} using {@code oidc-client-ts}.
 *
 * <p>This file is the <em>adapter</em> (infra). App code should not import it directly —
 * use {@link getAuth} / {@link useAuth} from the feature barrel instead.
 *
 * <h2>Responsibilities</h2>
 * <ul>
 *   <li>Redirect login / callback / logout against Cognito</li>
 *   <li>Persist tokens via oidc-client-ts ({@code localStorage})</li>
 *   <li>Auto-refresh tokens ({@code automaticSilentRenew})</li>
 *   <li>Forward library events to {@link AuthPort.subscribeToLibrarySession}</li>
 * </ul>
 */

/**
 * Maps an oidc-client-ts {@link User} profile into our {@link AuthUser}.
 *
 * @param user - OIDC user with ID token claims
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

/**
 * Maps a library user to {@link AuthSession}, or {@code null} if missing/expired.
 *
 * @param user - OIDC user, or {@code null}
 */
function toAuthSession(user: User | null): AuthSession | null {
  if (!user || user.expired) {
    return null
  }
  return { user: toAuthUser(user) }
}

/**
 * Builds {@link UserManager} settings for Cognito Hosted UI (authorize code + PKCE).
 *
 * @param config - env-based Cognito settings
 */
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
 * <p>{@link UserManager} is created lazily on first browser use so SSR does not
 * touch {@code window} / {@code localStorage}.
 *
 * @param config - Cognito OIDC configuration
 * @returns auth port implementation
 */
export function createOidcAuthAdapter(config: AuthConfig): AuthPort {
  // Lazy: UserManager touches window/localStorage — only create in the browser.
  let userManager: UserManager | null = null
  let oidcEventsWired = false

  /** React (and others) register here; we fan out when the OIDC library changes. */
  const librarySessionSubscribers = new Set<LibrarySessionSubscriber>()

  /**
   * Notifies every subscriber of a new session snapshot (imperative → listeners).
   *
   * @param session - session to publish, or {@code null} for logged out
   */
  const publishToLibrarySessionSubscribers = (
    session: AuthSession | null,
  ) => {
    for (const subscriber of librarySessionSubscribers) {
      subscriber(session)
    }
  }

  /**
   * Converts an OIDC {@link User} and publishes it to subscribers.
   *
   * @param user - library user, or {@code null}
   */
  const forwardOidcUserToSubscribers = (user: User | null) => {
    publishToLibrarySessionSubscribers(toAuthSession(user))
  }

  /**
   * Returns the shared {@link UserManager}, creating it and wiring OIDC events once.
   *
   * <p>Event wiring forwards library lifecycle into {@link publishToLibrarySessionSubscribers}
   * so React can stay in sync.
   *
   * @throws if called outside the browser
   */
  const getUserManager = (): UserManager => {
    if (typeof window === 'undefined') {
      throw new Error('Auth is only available in the browser')
    }
    if (!userManager) {
      userManager = new UserManager(buildUserManagerSettings(config))
    }
    if (!oidcEventsWired) {
      oidcEventsWired = true
      // Hook imperative OIDC events → our subscriber list → React state updates.
      userManager.events.addUserLoaded((user) => {
        forwardOidcUserToSubscribers(user)
      })
      userManager.events.addUserUnloaded(() => {
        forwardOidcUserToSubscribers(null)
      })
      userManager.events.addAccessTokenExpired(() => {
        void userManager!.getUser().then(forwardOidcUserToSubscribers)
      })
      userManager.events.addSilentRenewError(() => {
        forwardOidcUserToSubscribers(null)
      })
    }
    return userManager
  }

  /**
   * Loads the current user only if present and not expired.
   *
   * @returns valid {@link User}, or {@code null}
   */
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
      publishToLibrarySessionSubscribers(session)
      return session
    },

    async logout(): Promise<void> {
      await getUserManager().removeUser()
      publishToLibrarySessionSubscribers(null)

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

    subscribeToLibrarySession(
      subscriber: LibrarySessionSubscriber,
    ): () => void {
      librarySessionSubscribers.add(subscriber)
      return () => {
        librarySessionSubscribers.delete(subscriber)
      }
    },
  }
}
