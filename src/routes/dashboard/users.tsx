import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/users')({
  component: UsersPage,
})

const MOCK_USERS = [
  { id: '1', name: 'Alice Nguyen', role: 'Instructor', status: 'Active' },
  { id: '2', name: 'Brian Cole', role: 'Student', status: 'Active' },
  { id: '3', name: 'Chloe Park', role: 'Admin', status: 'Invited' },
  { id: '4', name: 'Diego Ruiz', role: 'Student', status: 'Suspended' },
]

function UsersPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
        <p className="text-muted-foreground">
          Mock user directory for future admin management.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_USERS.map((user) => (
              <tr key={user.id} className="border-t">
                <td className="px-4 py-3 font-medium">{user.name}</td>
                <td className="px-4 py-3">{user.role}</td>
                <td className="px-4 py-3">{user.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
