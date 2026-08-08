import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'

import {
  DataTable,
  DataTableColumnHeader,
} from '@/components/table'
import type { ColumnDef } from '@/components/table'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/dashboard/classrooms/list')({
  component: AllClassroomsPage,
})

/** PLACEHOLDER: mock classroom type/data until classrooms feature + API exist. */
type Classroom = {
  id: string
  name: string
  students: number
  status: 'Active' | 'Archived'
}

/** PLACEHOLDER: mock classroom rows for the DataTable demo. */
const MOCK_CLASSROOMS: Classroom[] = [
  { id: '1', name: 'English Foundations A', students: 28, status: 'Active' },
  { id: '2', name: 'Math Prep B', students: 22, status: 'Active' },
  { id: '3', name: 'Science Lab C', students: 18, status: 'Archived' },
  { id: '4', name: 'Writing Workshop D', students: 31, status: 'Active' },
  { id: '5', name: 'History Seminar E', students: 16, status: 'Active' },
  { id: '6', name: 'Art Studio F', students: 20, status: 'Archived' },
  { id: '7', name: 'Physics Lab G', students: 24, status: 'Active' },
  { id: '8', name: 'Debate Club H', students: 14, status: 'Active' },
  { id: '9', name: 'Chemistry Intro I', students: 27, status: 'Active' },
  { id: '10', name: 'Music Ensemble J', students: 19, status: 'Archived' },
  { id: '11', name: 'Biology Core K', students: 25, status: 'Active' },
  { id: '12', name: 'Geography Trek L', students: 21, status: 'Active' },
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
    accessorKey: 'students',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Students" />
    ),
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
  },
]

function AllClassroomsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            All Classrooms
          </h1>
          <p className="text-muted-foreground">
            Browse and manage every classroom in the platform.
          </p>
        </div>
        <Button asChild className="rounded-md">
          <Link to="/dashboard/classrooms/new">
            <PlusIcon className="size-4" aria-hidden />
            Create classroom
          </Link>
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={MOCK_CLASSROOMS}
        filterColumnId="name"
        filterPlaceholder="Filter classrooms..."
        padding={{
          cell: { x: 16, y: 14 },
          header: { x: 16, y: 12 },
        }}
        numbering={{
          enabled: true,
          mode: 'page' as const,
          title: 'No.',
        }}
        sorting={{
          columns: ['name'],
        }}
        striped={true}
      />
    </div>
  )
}
