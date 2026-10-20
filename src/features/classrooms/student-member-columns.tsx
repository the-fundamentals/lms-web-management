import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClassroomMemberResponse } from '@the-fundamentals/core-openapi'
import { removeClassroomMemberMutation } from '@the-fundamentals/core-openapi/react-query'
import { EllipsisVerticalIcon } from 'lucide-react'

import { useConfirmAction } from '@/components/confirm-action'
import { DataTableColumnHeader } from '@/components/table'
import type { ColumnDef } from '@/components/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { invalidateClassroomMembersQueries } from '@/features/classrooms/classrooms-query'
import { getPublicObjectUrl } from '@/features/storage'

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

function formatJoinedDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(date)
}

function StudentPersonCell({ member }: { member: ClassroomMemberResponse }) {
  const avatarUrl = getPublicObjectUrl(member.avatar)

  return (
    <div className="flex min-w-0 items-center gap-3">
      <Avatar>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
    </div>
  )
}

function StudentActionsCell({
  member,
  classroomId,
}: {
  member: ClassroomMemberResponse
  classroomId: string
}) {
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const removeMember = useMutation({
    ...removeClassroomMemberMutation(),
    onSuccess: () => {
      invalidateClassroomMembersQueries(queryClient, classroomId)
    },
  })

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${member.name}`}
          disabled={removeMember.isPending}
        >
          <EllipsisVerticalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem
          onSelect={() => {
            void navigator.clipboard.writeText(member.email)
          }}
        >
          Copy email
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={removeMember.isPending}
          onSelect={() => {
            void (async () => {
              const confirmed = await confirmAction({
                title: 'Remove this student?',
                description: "They won't be able to access this classroom.",
                confirmLabel: 'Remove',
                cancelLabel: 'Cancel',
                variant: 'destructive',
              })
              if (!confirmed) {
                return
              }
              removeMember.mutate({
                path: {
                  classroomId,
                  memberId: member.id,
                },
              })
            })()
          }}
        >
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Student roster columns for the People tab DataTable.
 *
 * `person` accessor concatenates name + email so the toolbar filter matches either.
 */
export function createStudentMemberColumns(
  classroomId: string,
): ColumnDef<ClassroomMemberResponse>[] {
  return [
    {
      id: 'person',
      accessorFn: (row) => `${row.name} ${row.email}`,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Person" />
      ),
      cell: ({ row }) => <StudentPersonCell member={row.original} />,
    },
    {
      accessorKey: 'createdDate',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Joined" />
      ),
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatJoinedDate(row.getValue('createdDate'))}
        </span>
      ),
    },
    {
      id: 'actions',
      enableSorting: false,
      enableHiding: false,
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <StudentActionsCell
            member={row.original}
            classroomId={classroomId}
          />
        </div>
      ),
    },
  ]
}
