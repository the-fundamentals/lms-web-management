import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/classrooms/$classroomId/people')(
  {
    component: ClassroomPeopleLayout,
  },
)

function ClassroomPeopleLayout() {
  return <Outlet />
}
