import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ClassroomMemberResponse,
  ClassroomSessionAttendanceStatus,
} from '@the-fundamentals/core-openapi'
import {
  createClassroomSessionAttendancesMutation,
  getAllClassroomSessionAttendancesQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { invalidateClassroomMemberAttendancesQueries } from '@/features/classrooms/classrooms-query'

const MAX_ATTENDANCES_PER_REQUEST = 30

type AttendanceMark = Extract<
  ClassroomSessionAttendanceStatus,
  'ATTENDED' | 'ABSENT'
>

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

function saveAttendanceLabel(count: number): string {
  if (count === 1) {
    return 'Save 1 mark'
  }
  return `Save ${count} marks`
}

function isAttendanceMark(value: string): value is AttendanceMark {
  return value === 'ATTENDED' || value === 'ABSENT'
}

export function TakeAttendanceDialog({
  open,
  onOpenChange,
  classroomId,
  sessionId,
  students,
  hasClassroomStudents,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  sessionId: string
  students: ReadonlyArray<ClassroomMemberResponse>
  hasClassroomStudents: boolean
}) {
  const queryClient = useQueryClient()
  const [marks, setMarks] = useState<Readonly<Record<string, AttendanceMark>>>(
    {},
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setMarks({})
      setError(null)
    }
  }, [open])

  const createAttendances = useMutation({
    ...createClassroomSessionAttendancesMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomSessionAttendancesQueryKey({
          path: { classroomId, sessionId },
        }),
      })
      invalidateClassroomMemberAttendancesQueries(queryClient)
      onOpenChange(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not save attendance. Try again.',
      )
    },
  })

  const markedEntries = Object.entries(marks)
  const markedCount = markedEntries.length
  const atLimit = markedCount >= MAX_ATTENDANCES_PER_REQUEST

  const setMemberMark = (memberId: string, value: string) => {
    setError(null)
    setMarks((current) => {
      if (!isAttendanceMark(value)) {
        return current
      }
      if (!(memberId in current) && Object.keys(current).length >= MAX_ATTENDANCES_PER_REQUEST) {
        return current
      }
      return { ...current, [memberId]: value }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take attendance</DialogTitle>
          <DialogDescription>
            Mark each student as present or absent.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-72 overflow-y-auto">
          {students.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              {hasClassroomStudents
                ? 'Every student already has attendance for this session.'
                : 'No students in this classroom.'}
            </p>
          ) : (
            <ul className="flex flex-col gap-0.5">
              {students.map((member) => {
                const mark = marks[member.id]
                const isDisabled =
                  createAttendances.isPending || (atLimit && mark === undefined)

                return (
                  <li
                    key={member.id}
                    className="flex items-center gap-3 rounded-md px-2 py-2"
                  >
                    <Avatar>
                      <AvatarFallback>
                        {initialsFromName(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">
                        {member.name}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {member.email}
                      </span>
                    </span>
                    <Select
                      value={mark}
                      onValueChange={(value) => setMemberMark(member.id, value)}
                      disabled={isDisabled}
                    >
                      <SelectTrigger
                        size="sm"
                        className="shrink-0"
                        aria-label={`Attendance for ${member.name}`}
                      >
                        <SelectValue placeholder="Mark" />
                      </SelectTrigger>
                      <SelectContent position="popper" align="end" className="z-[100]">
                        <SelectItem value="ATTENDED">Present</SelectItem>
                        <SelectItem value="ABSENT">Absent</SelectItem>
                      </SelectContent>
                    </Select>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : atLimit ? (
          <p className="text-sm text-muted-foreground">
            You can mark up to {MAX_ATTENDANCES_PER_REQUEST} students at a
            time.
          </p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            disabled={markedCount === 0 || createAttendances.isPending}
            onClick={() => {
              setError(null)
              createAttendances.mutate({
                path: { classroomId, sessionId },
                body: {
                  attendances: markedEntries.map(
                    ([classroomMemberId, status]) => ({
                      classroomMemberId,
                      status,
                    }),
                  ),
                },
              })
            }}
          >
            {createAttendances.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              saveAttendanceLabel(markedCount)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
