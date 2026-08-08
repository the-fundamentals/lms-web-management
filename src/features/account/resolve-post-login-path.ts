import {
  ensureMyAccountProfile,
  isAccountProfileNotFound,
} from '@/features/account/my-account-profile'
import type { QueryClient } from '@tanstack/react-query'

/** Where to send a user right after a successful sign-in. */
export type PostLoginPath = '/dashboard' | '/onboarding'

/**
 * Resolves post-login destination and seeds the profile cache when onboarded.
 */
export async function resolvePostLoginPath(
  queryClient: QueryClient,
): Promise<PostLoginPath> {
  try {
    await ensureMyAccountProfile(queryClient)
    return '/dashboard'
  } catch (cause) {
    if (isAccountProfileNotFound(cause)) {
      return '/onboarding'
    }
    throw cause
  }
}
