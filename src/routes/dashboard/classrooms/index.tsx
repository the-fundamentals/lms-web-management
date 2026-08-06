import { createFileRoute } from '@tanstack/react-router'

import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/table'
import type { ColumnDef } from '@/components/table'

export const Route = createFileRoute('/dashboard/classrooms/')({
  component: ClassroomsDashboardPage,
})

/** PLACEHOLDER: mock classroom type/data until classrooms feature + API exist. */
type Classroom = {
  id: string
  name: string
  instructor: string
  students: number
  schedule: string
  status: 'Active' | 'Archived'
}

/** PLACEHOLDER: mock classroom rows for the DataTable demo. */
const MOCK_CLASSROOMS: Classroom[] = [
  {
    id: '1',
    name: 'English Foundations A',
    instructor: 'Alice Nguyen',
    students: 28,
    schedule: 'Mon / Wed 09:00',
    status: 'Active',
  },
  {
    id: '2',
    name: 'Math Prep B',
    instructor: 'Brian Cole',
    students: 22,
    schedule: 'Tue / Thu 11:00',
    status: 'Active',
  },
  {
    id: '3',
    name: 'Science Lab C',
    instructor: 'Chloe Park',
    students: 18,
    schedule: 'Wed 14:00',
    status: 'Archived',
  },
  {
    id: '4',
    name: 'Writing Workshop D',
    instructor: 'Diego Ruiz',
    students: 31,
    schedule: 'Thu 10:00',
    status: 'Active',
  },
  {
    id: '5',
    name: 'History Seminar E',
    instructor: 'Emma Shaw',
    students: 16,
    schedule: 'Fri 13:00',
    status: 'Active',
  },
  {
    id: '6',
    name: 'Art Studio F',
    instructor: 'Frank Lee',
    students: 20,
    schedule: 'Mon 15:00',
    status: 'Archived',
  },
  {
    id: '7',
    name: 'Physics Lab G',
    instructor: 'Grace Kim',
    students: 24,
    schedule: 'Tue 09:30',
    status: 'Active',
  },
  {
    id: '8',
    name: 'Debate Club H',
    instructor: 'Hugo Tran',
    students: 14,
    schedule: 'Fri 16:00',
    status: 'Active',
  },
  {
    id: '9',
    name: 'Chemistry Intro I',
    instructor: 'Ivy Chen',
    students: 27,
    schedule: 'Wed / Fri 11:00',
    status: 'Active',
  },
  {
    id: '10',
    name: 'Music Ensemble J',
    instructor: 'James Ortiz',
    students: 19,
    schedule: 'Thu 15:30',
    status: 'Archived',
  },
  {
    id: '11',
    name: 'Biology Core K',
    instructor: 'Karen Wells',
    students: 25,
    schedule: 'Mon / Wed 13:00',
    status: 'Active',
  },
  {
    id: '12',
    name: 'Geography Trek L',
    instructor: 'Leo Martins',
    students: 21,
    schedule: 'Tue 14:00',
    status: 'Active',
  },
]

const columns: ColumnDef<Classroom>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="font-medium">{row.getValue('name')}</span>
    ),
  },
  {
    accessorKey: 'instructor',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Instructor" />
    ),
  },
  {
    accessorKey: 'students',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Students" />
    ),
  },
  {
    accessorKey: 'schedule',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Schedule" />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
  },
]

function ClassroomsDashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Classrooms Dashboard
        </h1>
        <p className="text-muted-foreground">
          Overview of classroom activity, enrollment, and upcoming sessions.
        </p>
      </div>
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Active classrooms</p>
          <p className="mt-2 text-3xl font-semibold">24</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Enrolled students</p>
          <p className="mt-2 text-3xl font-semibold">612</p>
        </div>
        <div className="rounded-xl bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">Sessions today</p>
          <p className="mt-2 text-3xl font-semibold">8</p>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-lg font-medium">Classrooms</h2>
          <p className="text-sm text-muted-foreground">
            Demo table — try sorting headers, filtering by name, and changing
            rows per page.
          </p>
        </div>
        <DataTable
          columns={columns}
          data={MOCK_CLASSROOMS}
          filterColumnId="name"
          filterPlaceholder="Filter classrooms..."
          numbering={{
            title: 'No.',
            mode: 'continuous',
          }}
          sorting={{
            // Demo uses inline (client) sort on the mock rows.
            // For an API later: mode: 'server' + controlled sorting /
            // onSortingChange, and pass already-sorted page data as `data`.
            mode: 'client',
            columns: ['name', 'students', 'status'],
          }}
          striped
          padding={{ cell: { x: 16, y: 14 }, header: { x: 16, y: 12 } }}
        />
      </div>
    </div>
  )
}
