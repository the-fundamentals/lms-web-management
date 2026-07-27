import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/classrooms/schedule')({
  component: ClassroomSchedulePage,
})

const MOCK_SESSIONS = [
  {
    id: '1',
    classroom: 'English Foundations A',
    day: 'Monday',
    time: '09:00 – 10:30',
  },
  {
    id: '2',
    classroom: 'Math Prep B',
    day: 'Tuesday',
    time: '11:00 – 12:30',
  },
  {
    id: '3',
    classroom: 'Science Lab C',
    day: 'Wednesday',
    time: '14:00 – 15:30',
  },
  {
    id: '4',
    classroom: 'Writing Workshop D',
    day: 'Thursday',
    time: '10:00 – 11:30',
  },
]

function ClassroomSchedulePage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Schedule</h1>
        <p className="text-muted-foreground">
          Upcoming classroom sessions and recurring weekly timetable.
        </p>
      </div>
      <div className="overflow-hidden rounded-xl border">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Classroom</th>
              <th className="px-4 py-3 font-medium">Day</th>
              <th className="px-4 py-3 font-medium">Time</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_SESSIONS.map((session) => (
              <tr key={session.id} className="border-t">
                <td className="px-4 py-3 font-medium">{session.classroom}</td>
                <td className="px-4 py-3">{session.day}</td>
                <td className="px-4 py-3">{session.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
