import { createFileRoute } from '@tanstack/react-router'

import { redirectIfAuthenticatedToApp } from '@/features/account'
import { LoginPage } from '@/features/auth'

export const Route = createFileRoute('/')({
  beforeLoad: ({ context }) => redirectIfAuthenticatedToApp(context.queryClient),
  component: LoginPage,
})
