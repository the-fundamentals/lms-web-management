import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type { ClassroomMemberResponse } from '@the-fundamentals/core-openapi'
import { removeClassroomMemberMutation } from '@the-fundamentals/core-openapi/react-query'
import { EllipsisVerticalIcon, UserPlusIcon } from 'lucide-react'

import { useConfirmAction } from '@/components/confirm-action'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AddStudentDialog,
  AddTeacherDialog,
} from '@/features/classrooms/components/add-student-dialog'
import {
  getAllClassroomMembersOptions,
  invalidateClassroomMembersQueries,
} from '@/features/classrooms/classrooms-query'

const peopleRoute = getRouteApi('/dashboard/classrooms/$classroomId/people/')

const TEACHER_ROLES = new Set(['ADMIN', 'TEACHER'])

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

function studentLabel(count: number): string {
  return count === 1 ? '1 student' : `${count} students`
}

function MemberIdentity({ member }: { member: ClassroomMemberResponse }) {
  return (
    <>
      <Avatar>
        <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
    </>
  )
}

function MemberActionsRow({
  member,
  classroomId,
  confirmTitle,
}: {
  member: ClassroomMemberResponse
  classroomId: string
  confirmTitle: string
}) {
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const removeMember = useMutation({
    ...removeClassroomMemberMutation(),
    onSuccess: () => {
      invalidateClassroomMembersQueries(queryClient)
    },
  })

  return (
    <div className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/60">
      <Link
        to="/dashboard/classrooms/$classroomId/people/$memberId"
        params={{ classroomId, memberId: member.id }}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <MemberIdentity member={member} />
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="ml-auto"
            aria-label={`Actions for ${member.name}`}
            disabled={removeMember.isPending}
            onClick={(event) => {
              event.stopPropagation()
            }}
          >
            <EllipsisVerticalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="min-w-36">
          <DropdownMenuItem
            variant="destructive"
            disabled={removeMember.isPending}
            onSelect={() => {
              void (async () => {
                const confirmed = await confirmAction({
                  title: confirmTitle,
                  description:
                    "They won't be able to access this classroom.",
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
    </div>
  )
}

function InviteButton({
  label,
  onClick,
}: {
  label: string
  onClick?: () => void
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
        >
          <UserPlusIcon />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  )
}

export function ClassroomPeoplePage() {
  const { classroomId } = peopleRoute.useParams()
  const [isAddStudentOpen, setIsAddStudentOpen] = useState(false)
  const [isAddTeacherOpen, setIsAddTeacherOpen] = useState(false)

  const { data = [], error, isPending, isError, refetch, isFetching } =
    useQuery(
      getAllClassroomMembersOptions({
        path: { classroomId },
        body: {
          page: 0,
          size: 50,
        },
      }),
    )

  const activeMembers = useMemo(
    () => data.filter((member) => member.status === 'ACTIVE'),
    [data],
  )

  const teachers = useMemo(
    () =>
      activeMembers
        .filter((member) => TEACHER_ROLES.has(member.role))
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeMembers],
  )

  const students = useMemo(
    () =>
      activeMembers
        .filter((member) => member.role === 'STUDENT')
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [activeMembers],
  )

  const existingMembersByAccountId = useMemo(
    () =>
      new Map(
        activeMembers.map((member) => [member.accountId, member.role] as const),
      ),
    [activeMembers],
  )

  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error
            ? error.message
            : 'Could not load classroom members.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium tracking-tight">Teachers</h2>
          <InviteButton
            label="Add teacher"
            onClick={() => setIsAddTeacherOpen(true)}
          />
        </div>
        <Separator />
        {teachers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No teachers yet.</p>
        ) : (
          <ul>
            {teachers.map((member) => (
              <li key={member.id}>
                <MemberActionsRow
                  member={member}
                  classroomId={classroomId}
                  confirmTitle="Remove this teacher?"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium tracking-tight">Students</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {studentLabel(students.length)}
            </span>
            <InviteButton
              label="Add student"
              onClick={() => setIsAddStudentOpen(true)}
            />
          </div>
        </div>
        <Separator />
        {students.length === 0 ? (
          <p className="text-sm text-muted-foreground">No students yet.</p>
        ) : (
          <ul>
            {students.map((member) => (
              <li key={member.id}>
                <MemberActionsRow
                  member={member}
                  classroomId={classroomId}
                  confirmTitle="Remove this student?"
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <AddTeacherDialog
        open={isAddTeacherOpen}
        onOpenChange={setIsAddTeacherOpen}
        classroomId={classroomId}
        existingMembersByAccountId={existingMembersByAccountId}
      />
      <AddStudentDialog
        open={isAddStudentOpen}
        onOpenChange={setIsAddStudentOpen}
        classroomId={classroomId}
        existingMembersByAccountId={existingMembersByAccountId}
      />
    </div>
  )
}
