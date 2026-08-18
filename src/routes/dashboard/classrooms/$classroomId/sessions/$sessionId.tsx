import { createFileRoute } from '@tanstack/react-router'

import { ClassroomSessionDetailsPage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/sessions/$sessionId',
)({
  component: ClassroomSessionDetailsPage,
})
