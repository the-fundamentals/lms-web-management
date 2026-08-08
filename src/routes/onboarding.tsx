import { createFileRoute } from '@tanstack/react-router'

import { OnboardingPage, requireOnboarding } from '@/features/account'

export const Route = createFileRoute('/onboarding')({
  beforeLoad: ({ context }) => requireOnboarding(context.queryClient),
  component: OnboardingPage,
})
