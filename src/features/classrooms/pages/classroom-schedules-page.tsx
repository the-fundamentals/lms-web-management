import { getRouteApi } from '@tanstack/react-router'

import { ClassroomScheduleCalendar } from '@/features/classrooms/components/classroom-schedule-calendar'

const scheduleRoute = getRouteApi('/dashboard/classrooms/$classroomId/schedule')

export function ClassroomSchedulesPage() {
  const { classroomId } = scheduleRoute.useParams()

  return <ClassroomScheduleCalendar classroomId={classroomId} />
}
