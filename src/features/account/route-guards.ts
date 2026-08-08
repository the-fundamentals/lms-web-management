import { redirect } from '@tanstack/react-router'
import type { QueryClient } from '@tanstack/react-query'

import {
  ensureMyAccountProfile,
  isAccountProfileNotFound,
} from '@/features/account/my-account-profile'
import { getAuth } from '@/features/auth'

/**
 * Sends an already-signed-in user to dashboard or onboarding (browser only).
 *
 * Seeds the profile query cache when the profile exists.
 */
export async function redirectIfAuthenticatedToApp(queryClient: QueryClient) {
  if (typeof window === 'undefined') {
    return
  }
  if (!(await getAuth().isAuthenticated())) {
    return
  }

  try {
    await ensureMyAccountProfile(queryClient)
  } catch (cause) {
    if (isAccountProfileNotFound(cause)) {
      throw redirect({ to: '/onboarding' })
    }
    throw cause
  }

  throw redirect({ to: '/dashboard' })
}

/**
 * Blocks a route unless the user has an account profile (onboarded).
 *
 * Populates the React Query cache on success. {@code 404} → {@code /onboarding}.
 */
export async function requireAccountProfile(queryClient: QueryClient) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    await ensureMyAccountProfile(queryClient)
  } catch (cause) {
    if (isAccountProfileNotFound(cause)) {
      throw redirect({ to: '/onboarding' })
    }
    throw cause
  }
}

/**
 * Onboarding route: must be signed in, and must not already have a profile.
 */
export async function requireOnboarding(queryClient: QueryClient) {
  if (typeof window === 'undefined') {
    return
  }
  if (!(await getAuth().isAuthenticated())) {
    throw redirect({ to: '/' })
  }

  try {
    await ensureMyAccountProfile(queryClient)
  } catch (cause) {
    if (isAccountProfileNotFound(cause)) {
      return
    }
    throw cause
  }

  throw redirect({ to: '/dashboard' })
}
