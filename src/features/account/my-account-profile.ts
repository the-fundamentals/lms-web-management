import {
  queryOptions,
  useQuery,
} from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { getMyAccountProfile } from '@the-fundamentals/core-openapi'
import type { AccountProfileResponse } from '@the-fundamentals/core-openapi'

/** Stable React Query key for the signed-in user's account profile. */
export const myAccountProfileQueryKey = ['my-account-profile'] as const

export type AccountProfileNotFoundError = Error & {
  status: 404
  code: 'ACCOUNT_PROFILE_NOT_FOUND'
}

/**
 * Whether a thrown value is the backend “no profile yet” response.
 */
export function isAccountProfileNotFound(
  error: unknown,
): error is AccountProfileNotFoundError {
  if (!error || typeof error !== 'object') {
    return false
  }
  const candidate = error as {
    status?: number
    code?: string
  }
  return (
    candidate.status === 404 ||
    candidate.code === 'ACCOUNT_PROFILE_NOT_FOUND'
  )
}

function toProfileError(
  error: { message: string; status: number; code: string },
  responseStatus?: number,
): Error {
  return Object.assign(new Error(error.message), {
    status: responseStatus ?? error.status,
    code: error.code,
  })
}

/**
 * Loads the current account profile, throwing on 404 / other API errors.
 */
export async function fetchMyAccountProfile(): Promise<AccountProfileResponse> {
  const { data, error, response } = await getMyAccountProfile()
  if (data) {
    return data
  }
  throw toProfileError(error, response?.status)
}

/**
 * Cached query options for {@link getMyAccountProfile}.
 */
export function myAccountProfileQueryOptions() {
  return queryOptions({
    queryKey: myAccountProfileQueryKey,
    queryFn: fetchMyAccountProfile,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error) =>
      !isAccountProfileNotFound(error) && failureCount < 2,
  })
}

/**
 * React Query hook for the signed-in user's profile (cached).
 *
 * @param enabled - typically {@code isAuthenticated}; skip while logged out
 */
export function useMyAccountProfile(enabled = true) {
  return useQuery({
    ...myAccountProfileQueryOptions(),
    enabled,
  })
}

/**
 * Ensures the profile is in the Query cache (used by route guards).
 *
 * @returns the profile when present
 * @throws {@link AccountProfileNotFoundError} when onboarding is required
 */
export async function ensureMyAccountProfile(
  queryClient: QueryClient,
): Promise<AccountProfileResponse> {
  return queryClient.ensureQueryData(myAccountProfileQueryOptions())
}

/** Writes a fresh profile into the cache (e.g. after onboarding). */
export function setMyAccountProfileCache(
  queryClient: QueryClient,
  profile: AccountProfileResponse,
): void {
  queryClient.setQueryData(myAccountProfileQueryKey, profile)
}

/** Clears the cached profile (e.g. on logout). */
export function clearMyAccountProfileCache(queryClient: QueryClient): void {
  queryClient.removeQueries({ queryKey: myAccountProfileQueryKey })
}

/** Display helpers derived from a profile row. */
export function getProfileDisplayName(profile: AccountProfileResponse): string {
  return `${profile.firstName} ${profile.lastName}`.trim()
}

export function getProfileInitials(profile: AccountProfileResponse): string {
  const first = profile.firstName.trim().charAt(0)
  const last = profile.lastName.trim().charAt(0)
  const initials = `${first}${last}`.toUpperCase()
  return initials || profile.email.slice(0, 2).toUpperCase()
}
