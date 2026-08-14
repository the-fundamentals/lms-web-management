import type { ClassroomResponse } from '@the-fundamentals/core-openapi'

import {
  DataTableColumnHeader,
} from '@/components/table'
import type { ColumnDef } from '@/components/table'

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export const classroomColumns: ColumnDef<ClassroomResponse>[] = [
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
    accessorKey: 'createdDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => formatDate(row.getValue('createdDate')),
  },
  {
    accessorKey: 'lastModifiedDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => formatDate(row.getValue('lastModifiedDate')),
  },
]
