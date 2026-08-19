import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ClassroomMemberResponse } from '@the-fundamentals/core-openapi'
import {
  createClassroomSessionAttendancesMutation,
  getAllClassroomSessionAttendancesQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { invalidateClassroomMemberAttendancesQueries } from '@/features/classrooms/classrooms-query'

const MAX_ATTENDANCES_PER_REQUEST = 30

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

function takeAttendanceLabel(count: number): string {
  if (count === 1) {
    return 'Mark 1 student present'
  }
  return `Mark ${count} students present`
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
  const [selectedMemberIds, setSelectedMemberIds] = useState<
    ReadonlySet<string>
  >(new Set())
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setSelectedMemberIds(new Set())
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

  const selectedCount = selectedMemberIds.size
  const atLimit = selectedCount >= MAX_ATTENDANCES_PER_REQUEST

  const toggleMember = (memberId: string) => {
    setError(null)
    setSelectedMemberIds((current) => {
      const next = new Set(current)
      if (next.has(memberId)) {
        next.delete(memberId)
        return next
      }
      if (next.size >= MAX_ATTENDANCES_PER_REQUEST) {
        return current
      }
      next.add(memberId)
      return next
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take attendance</DialogTitle>
          <DialogDescription>
            Select students who attended this session.
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
                const isSelected = selectedMemberIds.has(member.id)
                const isDisabled =
                  createAttendances.isPending || (atLimit && !isSelected)

                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
                      disabled={isDisabled}
                      aria-pressed={isSelected}
                      onClick={() => toggleMember(member.id)}
                    >
                      <Checkbox
                        checked={isSelected}
                        tabIndex={-1}
                        className="pointer-events-none"
                        aria-hidden
                      />
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
                    </button>
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
            disabled={selectedCount === 0 || createAttendances.isPending}
            onClick={() => {
              setError(null)
              createAttendances.mutate({
                path: { classroomId, sessionId },
                body: {
                  attendances: [...selectedMemberIds].map(
                    (classroomMemberId) => ({
                      classroomMemberId,
                      status: 'ATTENDED',
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
              takeAttendanceLabel(selectedCount)
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
