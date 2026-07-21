import { createIsomorphicFn } from '@tanstack/react-start'
import { getCookie } from '@tanstack/react-start/server'

export const AUTH_TOKEN_COOKIE = 'lms_auth_token'

const TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

export const getAuthToken = createIsomorphicFn()
  .server(() => getCookie(AUTH_TOKEN_COOKIE) ?? null)
  .client(() => {
    const match = document.cookie.match(
      new RegExp(`(?:^|; )${AUTH_TOKEN_COOKIE}=([^;]*)`),
    )
    return match ? decodeURIComponent(match[1]) : null
  })

export function setAuthToken(token: string) {
  document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${TOKEN_MAX_AGE_SECONDS}; SameSite=Lax`
}

export function clearAuthToken() {
  document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; SameSite=Lax`
}

export function isAuthenticated() {
  return Boolean(getAuthToken())
}

/** Demo-mode login: stores a mock token with no API call. */
export function mockLogin(_email?: string, _password?: string) {
  setAuthToken(`mock-token-${Date.now()}`)
}

/** Demo-mode logout: clears the stored auth token. */
export function mockLogout() {
  clearAuthToken()
}
