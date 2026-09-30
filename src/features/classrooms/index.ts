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
export { SetPaymentPlanDialog } from '@/features/classrooms/components/set-payment-plan-dialog'
export { ClassroomDetailsLayout } from '@/features/classrooms/pages/classroom-details-page'
export { ClassroomOverviewPage } from '@/features/classrooms/pages/classroom-overview-page'
export { ClassroomPeoplePage } from '@/features/classrooms/pages/classroom-people-page'
export { ClassroomSchedulesPage } from '@/features/classrooms/pages/classroom-schedules-page'
export { ClassroomFinancesPage } from '@/features/classrooms/pages/classroom-finances-page'
export { CreateClassroomPage } from '@/features/classrooms/pages/create-classroom-page'
