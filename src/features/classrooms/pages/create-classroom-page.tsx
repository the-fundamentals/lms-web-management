import { CreateClassroomForm } from '@/features/classrooms/components/create-classroom-form'

/**
 * Admin page to create a classroom via {@code POST /admin/classrooms}.
 */
export function CreateClassroomPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create classroom
        </h1>
        <p className="text-muted-foreground">
          Add a new classroom. You can enroll members and schedule sessions
          after it exists.
        </p>
      </div>
      <CreateClassroomForm />
    </div>
  )
}
