import { createFileRoute } from '@tanstack/react-router'

import { ClassroomMemberAttendancePage } from '@/features/classrooms'

export const Route = createFileRoute(
  '/dashboard/classrooms/$classroomId/people/$memberId',
)({
  component: ClassroomMemberAttendancePage,
})
