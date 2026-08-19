import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type {
  ClassroomMemberResponse,
  ClassroomSessionAttendanceResponse,
  ClassroomSessionAttendanceStatus,
} from '@the-fundamentals/core-openapi'
import {
  getAllClassroomSessionAttendancesOptions,
  getClassroomSessionByIdOptions,
} from '@the-fundamentals/core-openapi/react-query'
import { ChevronLeftIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { TakeAttendanceDialog } from '@/features/classrooms/components/take-attendance-dialog'
import { getAllClassroomMembersOptions } from '@/features/classrooms/classrooms-query'
import { formatSessionDateTime } from '@/features/classrooms/session-date'
import { cn } from '@/lib/utils'

const sessionDetailsRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/sessions/$sessionId',
)

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

function attendanceStatusLabel(
  status: ClassroomSessionAttendanceStatus,
): string {
  switch (status) {
    case 'ATTENDED':
      return 'Present'
    case 'ABSENT':
      return 'Absent'
    default:
      return 'Unset'
  }
}

function StatusChip({
  status,
}: {
  status: ClassroomSessionAttendanceStatus
}) {
  return (
    <span
      className={cn(
        'rounded-full px-2.5 py-0.5 text-xs font-medium',
        status === 'ATTENDED' &&
          'bg-[color-mix(in_oklch,var(--sidebar-tint)_14%,var(--background))] text-foreground',
        status === 'ABSENT' && 'bg-destructive/10 text-destructive',
        status === 'UNSET' && 'bg-muted text-muted-foreground',
      )}
    >
      {attendanceStatusLabel(status)}
    </span>
  )
}

function AttendanceRow({
  member,
  record,
}: {
  member: ClassroomMemberResponse
  record: ClassroomSessionAttendanceResponse
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar>
        <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{member.name}</p>
        <p className="truncate text-xs text-muted-foreground">{member.email}</p>
      </div>
      <StatusChip status={record.status} />
    </li>
  )
}

export function ClassroomSessionDetailsPage() {
  const { classroomId, sessionId } = sessionDetailsRoute.useParams()
  const [isTakeAttendanceOpen, setIsTakeAttendanceOpen] = useState(false)

  const attendancesQuery = useQuery(
    getAllClassroomSessionAttendancesOptions({
      path: { classroomId, sessionId },
    }),
  )

  const sessionQuery = useQuery(
    getClassroomSessionByIdOptions({
      path: { classroomId, sessionId },
    }),
  )
  const membersQuery = useQuery(
    getAllClassroomMembersOptions({
      path: { classroomId },
      body: { page: 0, size: 50 },
    }),
  )

  const students = useMemo(
    () =>
      (membersQuery.data ?? [])
        .filter(
          (member) => member.status === 'ACTIVE' && member.role === 'STUDENT',
        )
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [membersQuery.data],
  )

  const memberById = useMemo(
    () => new Map(students.map((member) => [member.id, member])),
    [students],
  )

  const attendances = attendancesQuery.data ?? []

  const recordedMemberIds = useMemo(
    () => new Set(attendances.map((record) => record.classroomMemberId)),
    [attendances],
  )

  const recordedRows = useMemo(
    () =>
      attendances
        .map((record) => {
          const member = memberById.get(record.classroomMemberId)
          if (!member) {
            return null
          }
          return { record, member }
        })
        .filter(
          (
            row,
          ): row is {
            record: ClassroomSessionAttendanceResponse
            member: ClassroomMemberResponse
          } => row !== null,
        )
        .sort((a, b) => a.member.name.localeCompare(b.member.name)),
    [attendances, memberById],
  )

  const unmarkedStudents = useMemo(
    () => students.filter((member) => !recordedMemberIds.has(member.id)),
    [students, recordedMemberIds],
  )

  const { data, error, isPending, isError, refetch, isFetching } = sessionQuery

  // hey-api query options type this as defined-data; first load is still pending.
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  if (isError || !data) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error
            ? error.message
            : 'Could not load this session.'}
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

  const session = data
  const title = session.name?.trim() || 'Untitled session'

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          to="/dashboard/classrooms/$classroomId/sessions"
          params={{ classroomId }}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Sessions
        </Link>
        <div>
          <h2 className="text-lg font-medium tracking-tight">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatSessionDateTime(session.sessionDate)}
          </p>
          {session.description?.trim() ? (
            <p className="mt-3 text-sm text-pretty">{session.description}</p>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-lg font-medium tracking-tight">Attendance</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {recordedRows.length === 1
                ? '1 recorded'
                : `${recordedRows.length} recorded`}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={membersQuery.isPending || attendancesQuery.isPending}
              onClick={() => setIsTakeAttendanceOpen(true)}
            >
              Take Attendance
            </Button>
          </div>
        </div>
        <Separator />
        {membersQuery.isPending || attendancesQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : membersQuery.isError || attendancesQuery.isError ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <p className="text-sm text-destructive" role="alert">
              {membersQuery.error instanceof Error
                ? membersQuery.error.message
                : attendancesQuery.error instanceof Error
                  ? attendancesQuery.error.message
                  : 'Could not load attendance.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              disabled={membersQuery.isFetching || attendancesQuery.isFetching}
              onClick={() => {
                void membersQuery.refetch()
                void attendancesQuery.refetch()
              }}
            >
              Try again
            </Button>
          </div>
        ) : recordedRows.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No attendance recorded yet.
          </p>
        ) : (
          <ul className="divide-y">
            {recordedRows.map(({ member, record }) => (
              <AttendanceRow
                key={record.id}
                member={member}
                record={record}
              />
            ))}
          </ul>
        )}
      </section>

      <TakeAttendanceDialog
        open={isTakeAttendanceOpen}
        onOpenChange={setIsTakeAttendanceOpen}
        classroomId={classroomId}
        sessionId={sessionId}
        students={unmarkedStudents}
        hasClassroomStudents={students.length > 0}
      />
    </div>
  )
}
