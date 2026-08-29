import { createFileRoute } from '@tanstack/react-router'

import { ClassroomFinancesPage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/finances',
)({
  component: ClassroomFinancesPage,
})
