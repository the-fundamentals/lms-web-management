import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type {
  ClassroomMemberRole,
  ClassroomSessionAttendanceResponse,
  ClassroomSessionAttendanceStatus,
} from '@the-fundamentals/core-openapi'
import { ChevronLeftIcon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  getAllClassroomMembersOptions,
  getAllClassroomSessionsOptions,
  getClassroomMemberAttendancesOptions,
} from '@/features/classrooms/classrooms-query'
import { formatSessionDateTime } from '@/features/classrooms/session-date'
import { cn } from '@/lib/utils'

const memberAttendanceRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/people/$memberId',
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

function roleLabel(role: ClassroomMemberRole): string {
  switch (role) {
    case 'ADMIN':
      return 'Admin'
    case 'TEACHER':
      return 'Teacher'
    case 'STUDENT':
      return 'Student'
    default:
      return role
  }
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

function attendanceSortTime(record: ClassroomSessionAttendanceResponse): number {
  return new Date(record.attendanceDate ?? record.createdDate).getTime()
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

function SummaryChip({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
      {children}
    </span>
  )
}

export function ClassroomMemberAttendancePage() {
  const { classroomId, memberId } = memberAttendanceRoute.useParams()

  const membersQuery = useQuery(
    getAllClassroomMembersOptions({
      path: { classroomId },
      body: { page: 0, size: 50 },
    }),
  )
  const attendancesQuery = useQuery(
    getClassroomMemberAttendancesOptions({
      path: { classroomId, memberId },
      body: {
        page: 0,
        size: 50,
        sortBy: 'attendanceDate',
        sortDirection: 'DESC',
      },
    }),
  )
  const sessionsQuery = useQuery(
    getAllClassroomSessionsOptions({
      path: { classroomId },
      body: { page: 0, size: 50 },
    }),
  )

  const member = useMemo(
    () => membersQuery.data?.find((item) => item.id === memberId),
    [membersQuery.data, memberId],
  )

  const sessionById = useMemo(
    () => new Map((sessionsQuery.data ?? []).map((session) => [session.id, session])),
    [sessionsQuery.data],
  )

  const records = useMemo(
    () =>
      (attendancesQuery.data ?? [])
        .slice()
        .sort((a, b) => attendanceSortTime(b) - attendanceSortTime(a)),
    [attendancesQuery.data],
  )

  const presentCount = records.filter((record) => record.status === 'ATTENDED')
    .length
  const absentCount = records.filter((record) => record.status === 'ABSENT')
    .length

  if (membersQuery.isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-6 h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    )
  }

  if (membersQuery.isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {membersQuery.error instanceof Error
            ? membersQuery.error.message
            : 'Could not load this classroom member.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          disabled={membersQuery.isFetching}
          onClick={() => void membersQuery.refetch()}
        >
          Try again
        </Button>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="flex max-w-3xl flex-col gap-3">
        <Link
          to="/dashboard/classrooms/$classroomId/people"
          params={{ classroomId }}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          People
        </Link>
        <p className="text-sm text-muted-foreground">
          This classroom member could not be found.
        </p>
      </div>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link
          to="/dashboard/classrooms/$classroomId/people"
          params={{ classroomId }}
          className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          People
        </Link>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-medium tracking-tight">
              {member.name}
            </h2>
            <p className="truncate text-sm text-muted-foreground">
              {member.email}
            </p>
          </div>
          <SummaryChip>{roleLabel(member.role)}</SummaryChip>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {attendancesQuery.isSuccess ? (
            <>
              <SummaryChip>
                {presentCount === 1
                  ? '1 present'
                  : `${presentCount} present`}
              </SummaryChip>
              <SummaryChip>
                {absentCount === 1 ? '1 absent' : `${absentCount} absent`}
              </SummaryChip>
            </>
          ) : null}
        </div>
      </div>

      <section className="flex flex-col gap-3">
        <h3 className="text-lg font-medium tracking-tight">Attendance</h3>
        <Separator />
        {attendancesQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : attendancesQuery.isError ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <p className="text-sm text-destructive" role="alert">
              {attendancesQuery.error instanceof Error
                ? attendancesQuery.error.message
                : 'Could not load attendance history.'}
            </p>
            <Button
              type="button"
              variant="outline"
              className="rounded-md"
              disabled={attendancesQuery.isFetching}
              onClick={() => void attendancesQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : records.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No attendance records yet.
          </p>
        ) : (
          <ul className="divide-y">
            {records.map((record) => {
              const session = sessionById.get(record.sessionId)
              const sessionName = session?.name?.trim() || 'Untitled session'
              const dateValue = record.attendanceDate ?? record.createdDate

              return (
                <li key={record.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {formatSessionDateTime(dateValue)}
                    </p>
                    {session ? (
                      <Link
                        to="/dashboard/classrooms/$classroomId/sessions/$sessionId"
                        params={{
                          classroomId,
                          sessionId: record.sessionId,
                        }}
                        className="mt-0.5 block truncate text-xs text-muted-foreground hover:text-foreground"
                      >
                        {sessionName} · {formatSessionDateTime(session.sessionDate)}
                      </Link>
                    ) : (
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        Session
                      </p>
                    )}
                  </div>
                  <StatusChip status={record.status} />
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
