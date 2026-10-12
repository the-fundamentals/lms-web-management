import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type {
  ClassroomMemberResponse,
  ClassroomMemberRole,
} from '@the-fundamentals/core-openapi'
import {
  getAllClassroomMembersOptions,
  removeClassroomMemberMutation,
} from '@the-fundamentals/core-openapi/react-query'
import { EllipsisVerticalIcon, UserPlusIcon } from 'lucide-react'

import { useConfirmAction } from '@/components/confirm-action'
import { DataTable } from '@/components/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AddStudentDialog,
  AddTeacherDialog,
} from '@/features/classrooms/components/add-student-dialog'
import { invalidateClassroomMembersQueries } from '@/features/classrooms/classrooms-query'
import { createStudentMemberColumns } from '@/features/classrooms/student-member-columns'
import { getPublicObjectUrl } from '@/features/storage'

const peopleRoute = getRouteApi('/dashboard/classrooms/$classroomId/people/')

const TEACHER_ROLES = new Set<ClassroomMemberRole>(['ADMIN', 'TEACHER'])

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

function teacherLabel(count: number): string {
  return count === 1 ? '1 teacher' : `${count} teachers`
}

function studentLabel(count: number): string {
  return count === 1 ? '1 student' : `${count} students`
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

function roleBadgeLabel(role: ClassroomMemberRole): string {
  if (role === 'ADMIN') {
    return 'Admin'
  }
  if (role === 'TEACHER') {
    return 'Teacher'
  }
  return 'Student'
}

function MemberIdentity({ member }: { member: ClassroomMemberResponse }) {
  // SDK field is `avatar` (storage key), not `avatarKey` like account profiles
  const avatarUrl = getPublicObjectUrl(member.avatar)

  return (
    <>
      <Avatar>
        {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
        <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
    </>
  )
}

function TeacherActionsRow({
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
    <div className="flex items-center gap-3 rounded-md px-2 py-2.5 hover:bg-muted/60">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <MemberIdentity member={member} />
      </div>
      <Badge variant="secondary">{roleBadgeLabel(member.role)}</Badge>
      <p className="hidden shrink-0 text-sm text-muted-foreground sm:block">
        Joined {formatJoinedDate(member.createdDate)}
      </p>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${member.name}`}
            disabled={removeMember.isPending}
            onClick={(event) => {
              event.stopPropagation()
            }}
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
                  title: 'Remove this teacher?',
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

function AddMemberButton({
  label,
  onClick,
}: {
  label: string
  onClick: () => void
}) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick}>
      <UserPlusIcon aria-hidden />
      {label}
    </Button>
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

  const studentColumns = useMemo(
    () => createStudentMemberColumns(classroomId),
    [classroomId],
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
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-72" />
        </div>
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
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Teachers</h2>
            <span className="text-sm text-muted-foreground">
              {teacherLabel(teachers.length)}
            </span>
          </div>
          <AddMemberButton
            label="Add teacher"
            onClick={() => setIsAddTeacherOpen(true)}
          />
        </div>
        {teachers.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-4 py-8">
            <p className="text-sm text-muted-foreground">
              No teachers yet. Add someone who can run this classroom.
            </p>
            <AddMemberButton
              label="Add teacher"
              onClick={() => setIsAddTeacherOpen(true)}
            />
          </div>
        ) : (
          <ul className="overflow-hidden rounded-xl border border-border">
            {teachers.map((member, index) => (
              <li
                key={member.id}
                className={index > 0 ? 'border-t border-border' : undefined}
              >
                <TeacherActionsRow
                  member={member}
                  classroomId={classroomId}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-baseline gap-2">
            <h2 className="text-lg font-semibold tracking-tight">Students</h2>
            <span className="text-sm text-muted-foreground">
              {studentLabel(students.length)}
            </span>
          </div>
          <AddMemberButton
            label="Add student"
            onClick={() => setIsAddStudentOpen(true)}
          />
        </div>
        {students.length === 0 ? (
          <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border px-4 py-8">
            <p className="text-sm text-muted-foreground">
              No students yet. Add learners to enroll them in this classroom.
            </p>
            <AddMemberButton
              label="Add student"
              onClick={() => setIsAddStudentOpen(true)}
            />
          </div>
        ) : (
          <DataTable
            columns={studentColumns}
            data={students}
            filterColumnId="person"
            filterPlaceholder="Filter by name or email..."
            numbering={{
              enabled: true,
              mode: 'page',
              title: 'No.',
            }}
            sorting={{
              mode: 'client',
              columns: ['person', 'createdDate'],
            }}
            pagination
            striped
            padding={{
              cell: { x: 16, y: 12 },
              header: { x: 16, y: 10 },
            }}
          />
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
