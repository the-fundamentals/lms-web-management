import { createFileRoute } from '@tanstack/react-router'

import { ClassroomPeoplePage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/people/',
)({
  component: ClassroomPeoplePage,
})
