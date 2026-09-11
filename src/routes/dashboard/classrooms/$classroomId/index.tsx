import { createFileRoute } from '@tanstack/react-router'

import { ClassroomOverviewPage } from '@/features/classrooms'

export const Route = createFileRoute('/dashboard/classrooms/$classroomId/')({
  component: ClassroomOverviewPage,
})
