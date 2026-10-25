import { createFileRoute } from '@tanstack/react-router'

import { ClassroomBillingPage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/billing',
)({
  component: ClassroomBillingPage,
})
