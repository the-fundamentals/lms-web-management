import { redirect } from '@tanstack/react-router'

import { getAuth } from '@/features/auth/create-auth'

/**
 * TanStack Router helpers for {@code beforeLoad}.
 *
 * These call {@link getAuth} (not React Context) because route loaders run
 * outside the React tree. Auth storage is browser-only, so on the server these
 * helpers no-op and let the client decide.
 */

/** Blocks a route unless the user has a valid local session. */
export async function requireAuthenticated() {
  if (typeof window === 'undefined') {
    return
  }
  if (!(await getAuth().isAuthenticated())) {
    throw redirect({ to: '/' })
  }
}

/** Sends an already-signed-in user away from public auth pages (e.g. login). */
export async function redirectIfAuthenticated() {
  if (typeof window === 'undefined') {
    return
  }
  if (await getAuth().isAuthenticated()) {
    throw redirect({ to: '/dashboard' })
  }
}
