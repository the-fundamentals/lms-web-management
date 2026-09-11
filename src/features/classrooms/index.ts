/**
 * Classrooms feature — admin classroom management UI.
 */

export { classroomColumns } from '@/features/classrooms/classroom-columns'
export {
  getAllClassroomsOptions,
  invalidateClassroomsQueries,
  useClassrooms,
} from '@/features/classrooms/classrooms-query'
export { CreateClassroomForm } from '@/features/classrooms/components/create-classroom-form'
export { AddStudentDialog, AddTeacherDialog } from '@/features/classrooms/components/add-student-dialog'
export { CreateSessionDialog } from '@/features/classrooms/components/create-session-dialog'
export { CreateScheduleDialog } from '@/features/classrooms/components/create-schedule-dialog'
export { SetPaymentPlanDialog } from '@/features/classrooms/components/set-payment-plan-dialog'
export { TakeAttendanceDialog } from '@/features/classrooms/components/take-attendance-dialog'
export { EditAttendanceDialog } from '@/features/classrooms/components/edit-attendance-dialog'
export { ClassroomDetailsLayout } from '@/features/classrooms/pages/classroom-details-page'
export { ClassroomOverviewPage } from '@/features/classrooms/pages/classroom-overview-page'
export { ClassroomPeoplePage } from '@/features/classrooms/pages/classroom-people-page'
export { ClassroomMemberAttendancePage } from '@/features/classrooms/pages/classroom-member-attendance-page'
export { ClassroomSessionsPage } from '@/features/classrooms/pages/classroom-sessions-page'
export { ClassroomSchedulesPage } from '@/features/classrooms/pages/classroom-schedules-page'
export { ClassroomFinancesPage } from '@/features/classrooms/pages/classroom-finances-page'
export { ClassroomSessionDetailsPage } from '@/features/classrooms/pages/classroom-session-details-page'
export { CreateClassroomPage } from '@/features/classrooms/pages/create-classroom-page'
