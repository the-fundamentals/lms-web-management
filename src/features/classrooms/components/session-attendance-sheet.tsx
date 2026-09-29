import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type {
  ClassroomSessionAttendanceResponse,
  ClassroomSessionAttendanceStatus,
  ClassroomSessionStatus,
  ClassroomSessionType,
} from '@the-fundamentals/core-openapi'
import { updateClassroomSessionAttendance } from '@the-fundamentals/core-openapi'
import {
  completeClassroomSessionMutation,
  createClassroomSessionAttendancesMutation,
  getAllClassroomMembersOptions,
  getAllClassroomSessionAttendancesOptions,
  getAllClassroomSessionAttendancesQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'
import 'temporal-polyfill/global'

import { useConfirmAction } from '@/components/confirm-action'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { invalidateClassroomSessionsQueries } from '@/features/classrooms/classrooms-query'
import { cn } from '@/lib/utils'

/** API create batch ceiling from CreateClassroomSessionAttendancesCommand. */
const MAX_CREATE_BATCH = 30

export type SessionAttendanceTarget = {
  sessionId: string
  status: ClassroomSessionStatus
  type: ClassroomSessionType
  name: string
  description: string
  sessionDate: string
  startTime: string
  endTime: string
}

function sessionDisplayTitle(
  name: string | undefined,
  type: ClassroomSessionType,
): string {
  const trimmed = name?.trim()
  if (trimmed) {
    return trimmed
  }
  return type === 'ADHOC' ? 'Adhoc' : 'Session'
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

function formatSessionDate(value: string): string {
  try {
    return Temporal.PlainDate.from(value).toLocaleString(undefined, {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return value
  }
}

const STATUS_BADGE_CLASS: Record<ClassroomSessionStatus, string> = {
  OPEN: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  COMPLETED: 'bg-muted text-muted-foreground',
  CANCELLED: 'bg-destructive/10 text-destructive',
}

function MetaBadge({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase',
        className,
      )}
    >
      {children}
    </span>
  )
}

function AttendanceToggle({
  value,
  disabled,
  onChange,
}: {
  value: ClassroomSessionAttendanceStatus
  disabled: boolean
  onChange: (next: ClassroomSessionAttendanceStatus) => void
}) {
  const options: Array<{
    status: ClassroomSessionAttendanceStatus
    label: string
  }> = [
    { status: 'ATTENDED', label: 'Present' },
    { status: 'ABSENT', label: 'Absent' },
  ]

  return (
    <div className="inline-flex rounded-lg border bg-muted/40 p-0.5">
      {options.map((option) => {
        const active = value === option.status
        return (
          <button
            key={option.status}
            type="button"
            disabled={disabled}
            aria-pressed={active}
            className={cn(
              'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
              active
                ? option.status === 'ATTENDED'
                  ? 'bg-emerald-500/15 text-emerald-700 shadow-sm dark:text-emerald-400'
                  : 'bg-destructive/10 text-destructive shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => onChange(option.status)}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

function buildDraftFromServer(
  attendanceByMemberId: ReadonlyMap<string, ClassroomSessionAttendanceResponse>,
  studentIds: ReadonlyArray<string>,
): Record<string, ClassroomSessionAttendanceStatus> {
  const draft: Record<string, ClassroomSessionAttendanceStatus> = {}
  for (const memberId of studentIds) {
    draft[memberId] = attendanceByMemberId.get(memberId)?.status ?? 'UNSET'
  }
  return draft
}

export function SessionAttendanceSheet({
  open,
  onOpenChange,
  classroomId,
  session,
  onSessionChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  session: SessionAttendanceTarget | null
  onSessionChange: (
    next: Partial<Pick<SessionAttendanceTarget, 'status'>>,
  ) => void
}) {
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const [error, setError] = useState<string | null>(null)
  const [draft, setDraft] = useState<
    Record<string, ClassroomSessionAttendanceStatus>
  >({})
  const [isSaving, setIsSaving] = useState(false)

  const sessionId = session?.sessionId
  const isOpen = session?.status === 'OPEN'
  const canEditAttendance = Boolean(isOpen)

  const membersQuery = useQuery({
    ...getAllClassroomMembersOptions({
      path: { classroomId },
    }),
    enabled: open && Boolean(sessionId),
  })

  const attendancesQuery = useQuery({
    ...getAllClassroomSessionAttendancesOptions({
      path: {
        classroomId,
        sessionId: sessionId ?? '',
      },
    }),
    enabled: open && Boolean(sessionId),
  })

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

  const attendanceByMemberId = useMemo(() => {
    const map = new Map<string, ClassroomSessionAttendanceResponse>()
    for (const row of attendancesQuery.data ?? []) {
      map.set(row.classroomMemberId, row)
    }
    return map
  }, [attendancesQuery.data])

  const studentIdsKey = students.map((student) => student.id).join(',')
  const attendancesDataKey = (attendancesQuery.data ?? [])
    .map((row) => `${row.classroomMemberId}:${row.status}:${row.id}`)
    .join('|')

  useEffect(() => {
    if (!open || !sessionId) {
      setDraft({})
      return
    }
    if (membersQuery.isPending || attendancesQuery.isPending) {
      return
    }
    setDraft(
      buildDraftFromServer(
        attendanceByMemberId,
        students.map((student) => student.id),
      ),
    )
    setError(null)
    // Rehydrate draft when sheet opens or server roster/attendance changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed via studentIdsKey / attendancesDataKey
  }, [
    open,
    sessionId,
    studentIdsKey,
    attendancesDataKey,
    membersQuery.isPending,
    attendancesQuery.isPending,
  ])

  function invalidateAttendances() {
    if (!sessionId) {
      return
    }
    void queryClient.invalidateQueries({
      queryKey: getAllClassroomSessionAttendancesQueryKey({
        path: { classroomId, sessionId },
      }),
    })
  }

  const createAttendance = useMutation(createClassroomSessionAttendancesMutation())

  const completeSession = useMutation({
    ...completeClassroomSessionMutation(),
    onSuccess: (updated) => {
      invalidateClassroomSessionsQueries(queryClient)
      onSessionChange({ status: updated.status })
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not complete the session. Try again.',
      )
    },
  })

  const dirtyChanges = useMemo(() => {
    const creates: Array<{
      classroomMemberId: string
      status: ClassroomSessionAttendanceStatus
    }> = []
    const updates: Array<{
      attendanceId: string
      status: ClassroomSessionAttendanceStatus
    }> = []

    for (const student of students) {
      const next = draft[student.id] ?? 'UNSET'
      const existing = attendanceByMemberId.get(student.id)
      const current = existing?.status ?? 'UNSET'
      if (next === current) {
        continue
      }
      if (!existing) {
        if (next !== 'UNSET') {
          creates.push({ classroomMemberId: student.id, status: next })
        }
        continue
      }
      updates.push({ attendanceId: existing.id, status: next })
    }

    return { creates, updates }
  }, [students, draft, attendanceByMemberId])

  const isDirty =
    dirtyChanges.creates.length > 0 || dirtyChanges.updates.length > 0

  async function saveAttendance() {
    if (!sessionId || !canEditAttendance || !isDirty) {
      return
    }
    setError(null)
    setIsSaving(true)
    try {
      const { creates, updates } = dirtyChanges
      if (creates.length > MAX_CREATE_BATCH) {
        setError(
          `You can create at most ${MAX_CREATE_BATCH} attendance records at once.`,
        )
        return
      }
      if (creates.length > 0) {
        await createAttendance.mutateAsync({
          path: { classroomId, sessionId },
          body: { attendances: creates },
        })
      }
      // No batch update API — patch changed rows after the create batch.
      for (const update of updates) {
        await updateClassroomSessionAttendance({
          path: {
            classroomId,
            sessionId,
            attendanceId: update.attendanceId,
          },
          body: { status: update.status },
          throwOnError: true,
        })
      }
      invalidateAttendances()
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not save attendance. Try again.',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const isLoading =
    (membersQuery.isPending || attendancesQuery.isPending) &&
    !membersQuery.data &&
    !attendancesQuery.data
  const loadError = membersQuery.isError || attendancesQuery.isError
  const isBusy = isSaving || completeSession.isPending

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setError(null)
          setDraft({})
          setIsSaving(false)
        }
        onOpenChange(next)
      }}
    >
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        {session ? (
          <>
            <SheetHeader className="border-b pr-12">
              <div className="flex flex-wrap items-center gap-1.5">
                <MetaBadge className={STATUS_BADGE_CLASS[session.status]}>
                  {session.status}
                </MetaBadge>
                <MetaBadge className="bg-muted text-muted-foreground">
                  {session.type === 'ADHOC' ? 'Adhoc' : 'Schedule'}
                </MetaBadge>
              </div>
              <SheetTitle>
                {sessionDisplayTitle(session.name, session.type)}
              </SheetTitle>
              <SheetDescription>
                {formatSessionDate(session.sessionDate)} ·{' '}
                <span className="tabular-nums">
                  {formatTime(session.startTime)}–{formatTime(session.endTime)}
                </span>
              </SheetDescription>
              {session.description ? (
                <p className="pt-1 text-sm text-muted-foreground">
                  {session.description}
                </p>
              ) : null}
            </SheetHeader>

            <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-medium">Attendance</h3>
                {!canEditAttendance ? (
                  <p className="text-xs text-muted-foreground">Read only</p>
                ) : isDirty ? (
                  <p className="text-xs text-muted-foreground">Unsaved changes</p>
                ) : null}
              </div>

              {isLoading ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Loading roster…
                </p>
              ) : loadError ? (
                <div className="flex flex-col items-center gap-3 py-8">
                  <p className="text-sm text-destructive" role="alert">
                    Could not load attendance.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void membersQuery.refetch()
                      void attendancesQuery.refetch()
                    }}
                  >
                    Try again
                  </Button>
                </div>
              ) : students.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No students in this classroom.
                </p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {students.map((student) => {
                    const status = draft[student.id] ?? 'UNSET'

                    return (
                      <li
                        key={student.id}
                        className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-muted/50"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {student.name}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {student.email}
                          </p>
                          {status === 'UNSET' && canEditAttendance ? (
                            <p className="mt-0.5 text-[11px] text-muted-foreground">
                              Not marked
                            </p>
                          ) : null}
                        </div>
                        <AttendanceToggle
                          value={status}
                          disabled={!canEditAttendance || isBusy}
                          onChange={(next) => {
                            setError(null)
                            setDraft((current) => ({
                              ...current,
                              [student.id]: next,
                            }))
                          }}
                        />
                      </li>
                    )
                  })}
                </ul>
              )}

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            {canEditAttendance ? (
              <SheetFooter className="border-t sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="outline"
                  disabled={!isDirty || isBusy}
                  onClick={() => {
                    void saveAttendance()
                  }}
                >
                  {isSaving ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                      Saving…
                    </>
                  ) : (
                    'Save attendance'
                  )}
                </Button>
                <Button
                  type="button"
                  disabled={isBusy || isDirty}
                  onClick={() => {
                    void (async () => {
                      const confirmed = await confirmAction({
                        title: 'Complete this session?',
                        description:
                          'Attendance and session details will be locked after completion.',
                        confirmLabel: 'Complete session',
                        cancelLabel: 'Keep open',
                      })
                      if (!confirmed || !sessionId) {
                        return
                      }
                      setError(null)
                      completeSession.mutate({
                        path: { classroomId, sessionId },
                      })
                    })()
                  }}
                >
                  {completeSession.isPending ? (
                    <>
                      <Loader2Icon className="size-4 animate-spin" aria-hidden />
                      Completing…
                    </>
                  ) : (
                    'Complete session'
                  )}
                </Button>
              </SheetFooter>
            ) : null}
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}
