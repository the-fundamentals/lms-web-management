/**
 * Classrooms feature — admin classroom management UI.
 */

export { classroomColumns } from '@/features/classrooms/classroom-columns'
export { createStudentMemberColumns } from '@/features/classrooms/student-member-columns'
export {
  getAllClassroomsOptions,
  invalidateClassroomsQueries,
  useClassrooms,
} from '@/features/classrooms/classrooms-query'
export { CreateClassroomForm } from '@/features/classrooms/components/create-classroom-form'
export { AddStudentDialog, AddTeacherDialog } from '@/features/classrooms/components/add-student-dialog'
export { ClassroomBillingPage } from '@/features/classrooms/pages/classroom-billing-page'
export { ClassroomDetailsLayout } from '@/features/classrooms/pages/classroom-details-page'
export { ClassroomOverviewPage } from '@/features/classrooms/pages/classroom-overview-page'
export { ClassroomPeoplePage } from '@/features/classrooms/pages/classroom-people-page'
export { ClassroomSchedulesPage } from '@/features/classrooms/pages/classroom-schedules-page'
export { CreateClassroomPage } from '@/features/classrooms/pages/create-classroom-page'
