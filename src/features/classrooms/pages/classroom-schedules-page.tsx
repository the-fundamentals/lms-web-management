import { ClassroomScheduleCalendar } from '@/features/classrooms/components/classroom-schedule-calendar'

export function ClassroomSchedulesPage() {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-lg font-medium tracking-tight">Schedule</h2>
      <ClassroomScheduleCalendar />
    </section>
  )
}
