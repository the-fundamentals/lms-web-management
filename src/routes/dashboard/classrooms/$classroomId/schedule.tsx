import { createFileRoute } from '@tanstack/react-router'

import { ClassroomSchedulesPage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/schedule',
)({
  component: ClassroomSchedulesPage,
})
