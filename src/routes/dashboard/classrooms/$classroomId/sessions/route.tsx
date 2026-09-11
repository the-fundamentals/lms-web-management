import { createFileRoute, Outlet } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/classrooms/$classroomId/sessions')(
  {
    component: ClassroomSessionsLayout,
  },
)

function ClassroomSessionsLayout() {
  return <Outlet />
}
