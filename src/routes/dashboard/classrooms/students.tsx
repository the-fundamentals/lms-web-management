import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/classrooms/students')({
  component: ClassroomStudentsPage,
})

const MOCK_STUDENTS = [
  {
    id: '1',
    name: 'Alice Nguyen',
    classroom: 'English Foundations A',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Brian Cole',
    classroom: 'Math Prep B',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Chloe Park',
    classroom: 'Writing Workshop D',
    status: 'Invited',
  },
  {
    id: '4',
    name: 'Diego Ruiz',
    classroom: 'Science Lab C',
    status: 'Inactive',
  },
]

function ClassroomStudentsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Students</h1>
        <p className="text-muted-foreground">
          View and manage students across all classrooms.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Classroom</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_STUDENTS.map((student) => (
              <tr key={student.id} className="border-t">
                <td className="px-4 py-3 font-medium">{student.name}</td>
                <td className="px-4 py-3">{student.classroom}</td>
                <td className="px-4 py-3">{student.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
