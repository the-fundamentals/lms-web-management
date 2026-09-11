import { createFileRoute } from '@tanstack/react-router'

import { ClassroomDetailsLayout } from '@/features/classrooms'

export const Route = createFileRoute('/dashboard/classrooms/$classroomId')({
  component: ClassroomDetailsLayoutRoute,
})

function ClassroomDetailsLayoutRoute() {
  const { classroomId } = Route.useParams()
  return <ClassroomDetailsLayout classroomId={classroomId} />
}
