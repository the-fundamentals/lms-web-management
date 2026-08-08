/**
 * Account feature — profile / onboarding status against the Core API.
 */

export { resolvePostLoginPath } from '@/features/account/resolve-post-login-path'
export type { PostLoginPath } from '@/features/account/resolve-post-login-path'
export {
  redirectIfAuthenticatedToApp,
  requireAccountProfile,
  requireOnboarding,
} from '@/features/account/route-guards'
export {
  clearMyAccountProfileCache,
  ensureMyAccountProfile,
  fetchMyAccountProfile,
  getProfileDisplayName,
  getProfileInitials,
  isAccountProfileNotFound,
  myAccountProfileQueryKey,
  myAccountProfileQueryOptions,
  setMyAccountProfileCache,
  useMyAccountProfile,
} from '@/features/account/my-account-profile'
export type { AccountProfileNotFoundError } from '@/features/account/my-account-profile'
export { OnboardingPage } from '@/features/account/pages/onboarding-page'
