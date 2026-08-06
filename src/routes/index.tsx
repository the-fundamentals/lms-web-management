import { createFileRoute } from '@tanstack/react-router'

import { LoginPage, redirectIfAuthenticated } from '@/features/auth'

export const Route = createFileRoute('/')({
  beforeLoad: () => redirectIfAuthenticated(),
  component: LoginPage,
})
