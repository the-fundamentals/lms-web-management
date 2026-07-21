import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/courses')({
  component: CoursesPage,
})

const MOCK_COURSES = [
  {
    id: '1',
    title: 'Intro to Product Design',
    students: 320,
    status: 'Published',
  },
  { id: '2', title: 'Advanced TypeScript', students: 186, status: 'Published' },
  { id: '3', title: 'Ops for Founders', students: 54, status: 'Draft' },
]

function CoursesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Courses</h1>
        <p className="text-muted-foreground">
          Mock course catalog for the management dashboard.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MOCK_COURSES.map((course) => (
          <div key={course.id} className="rounded-xl bg-muted/50 p-5">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {course.status}
            </p>
            <h2 className="mt-2 text-lg font-medium">{course.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {course.students} enrolled students
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
