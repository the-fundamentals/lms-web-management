import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type {
  ClassroomMemberResponse,
  ClassroomSessionAttendanceResponse,
  ClassroomSessionAttendanceStatus,
} from '@the-fundamentals/core-openapi'
import {
  createClassroomSessionAttendanceMutation,
  deleteClassroomSessionAttendanceMutation,
  getClassroomSessionByIdOptions,
} from '@the-fundamentals/core-openapi/react-query'
import { ChevronLeftIcon, Loader2Icon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllClassroomMembersOptions } from '@/features/classrooms/classrooms-query'
import { formatSessionDateTime } from '@/features/classrooms/session-date'

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

function attendanceMapQueryKey(classroomId: string, sessionId: string) {
  return ['classroomSessionAttendances', classroomId, sessionId] as const
}

function AttendanceMark({
  status,
  current,
  disabled,
  onSelect,
}: {
  status: Exclude<ClassroomSessionAttendanceStatus, 'UNSET'>
  current: ClassroomSessionAttendanceStatus | undefined
  disabled: boolean
  onSelect: () => void
}) {
  const isActive = current === status
  return (
    <Button
      type="button"
      size="sm"
      variant={isActive ? 'default' : 'outline'}
      disabled={disabled}
      aria-pressed={isActive}
      onClick={onSelect}
    >
      {status === 'ATTENDED' ? 'Present' : 'Absent'}
    </Button>
  )
}

function AttendanceRow({
  member,
  classroomId,
  sessionId,
  record,
}: {
  member: ClassroomMemberResponse
  classroomId: string
  sessionId: string
  record: ClassroomSessionAttendanceResponse | undefined
}) {
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const createAttendance = useMutation(createClassroomSessionAttendanceMutation())
  const deleteAttendance = useMutation(deleteClassroomSessionAttendanceMutation())
  const isBusy = createAttendance.isPending || deleteAttendance.isPending

  const cacheKey = attendanceMapQueryKey(classroomId, sessionId)

  function writeCache(
    next: ClassroomSessionAttendanceResponse | undefined,
  ) {
    queryClient.setQueryData<
      Record<string, ClassroomSessionAttendanceResponse>
    >(cacheKey, (current = {}) => {
      const updated = { ...current }
      if (next) {
        updated[member.id] = next
      } else {
        delete updated[member.id]
      }
      return updated
    })
  }

  async function setStatus(
    status: Exclude<ClassroomSessionAttendanceStatus, 'UNSET'>,
  ) {
    setError(null)
    try {
      if (record?.status === status) {
        await deleteAttendance.mutateAsync({
          path: {
            classroomId,
            sessionId,
            attendanceId: record.id,
          },
        })
        writeCache(undefined)
        return
      }

      if (record) {
        await deleteAttendance.mutateAsync({
          path: {
            classroomId,
            sessionId,
            attendanceId: record.id,
          },
        })
        writeCache(undefined)
      }

      const created = await createAttendance.mutateAsync({
        path: { classroomId, sessionId },
        body: {
          classroomMemberId: member.id,
          status,
        },
      })
      writeCache(created)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not update attendance. Try again.',
      )
    }
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex items-center gap-3">
        <Avatar>
          <AvatarFallback>{initialsFromName(member.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{member.name}</p>
          <p className="truncate text-xs text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex items-center gap-1.5">
          {isBusy ? (
            <Loader2Icon
              className="size-4 animate-spin text-muted-foreground"
              aria-hidden
            />
          ) : null}
          <AttendanceMark
            status="ATTENDED"
            current={record?.status}
            disabled={isBusy}
            onSelect={() => void setStatus('ATTENDED')}
          />
          <AttendanceMark
            status="ABSENT"
            current={record?.status}
            disabled={isBusy}
            onSelect={() => void setStatus('ABSENT')}
          />
        </div>
      </div>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </li>
  )
}

export function ClassroomSessionDetailsPage() {
  const { classroomId, sessionId } = sessionDetailsRoute.useParams()
  const { data: attendanceByMemberId = {} } = useQuery({
    queryKey: attendanceMapQueryKey(classroomId, sessionId),
    queryFn: async () =>
      ({}) as Record<string, ClassroomSessionAttendanceResponse>,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
  })

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

  if (sessionQuery.isPending) {
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

  if (sessionQuery.isError || !sessionQuery.data) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {sessionQuery.error instanceof Error
            ? sessionQuery.error.message
            : 'Could not load this session.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          disabled={sessionQuery.isFetching}
          onClick={() => void sessionQuery.refetch()}
        >
          Try again
        </Button>
      </div>
    )
  }

  const session = sessionQuery.data
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
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-lg font-medium tracking-tight">Attendance</h3>
          <span className="text-sm text-muted-foreground">
            {students.length === 1 ? '1 student' : `${students.length} students`}
          </span>
        </div>
        <Separator />
        <p className="text-xs text-muted-foreground">
          Marks are saved as you click. Click the same mark again to clear it.
        </p>
        {membersQuery.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : membersQuery.isError ? (
          <div className="flex flex-col items-start gap-3 py-4">
            <p className="text-sm text-destructive" role="alert">
              {membersQuery.error instanceof Error
                ? membersQuery.error.message
                : 'Could not load students.'}
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
        ) : students.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">
            No students in this classroom.
          </p>
        ) : (
          <ul className="divide-y">
            {students.map((member) => (
              <AttendanceRow
                key={member.id}
                member={member}
                classroomId={classroomId}
                sessionId={sessionId}
                record={attendanceByMemberId[member.id]}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
