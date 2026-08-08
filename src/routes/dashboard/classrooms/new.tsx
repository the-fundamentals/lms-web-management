import { createFileRoute } from '@tanstack/react-router'

import { CreateClassroomPage } from '@/features/classrooms'

export const Route = createFileRoute('/dashboard/classrooms/new')({
  component: CreateClassroomPage,
})
