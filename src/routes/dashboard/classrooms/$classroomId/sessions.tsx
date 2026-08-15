import { createFileRoute } from '@tanstack/react-router'

import { ClassroomSessionsPage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/sessions',
)({
  component: ClassroomSessionsPage,
})
