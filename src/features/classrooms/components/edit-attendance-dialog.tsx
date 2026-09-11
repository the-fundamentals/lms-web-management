import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type {
  ClassroomMemberResponse,
  ClassroomSessionAttendanceResponse,
  ClassroomSessionAttendanceStatus,
} from '@the-fundamentals/core-openapi'
import {
  getAllClassroomSessionAttendancesQueryKey,
  updateClassroomSessionAttendanceMutation,
} from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { invalidateClassroomMemberAttendancesQueries } from '@/features/classrooms/classrooms-query'

type AttendanceMark = Extract<
  ClassroomSessionAttendanceStatus,
  'ATTENDED' | 'ABSENT'
>

function toMark(
  status: ClassroomSessionAttendanceStatus,
): AttendanceMark | undefined {
  if (status === 'ATTENDED' || status === 'ABSENT') {
    return status
  }
  return undefined
}

export function EditAttendanceDialog({
  open,
  onOpenChange,
  classroomId,
  sessionId,
  member,
  record,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  sessionId: string
  member: ClassroomMemberResponse
  record: ClassroomSessionAttendanceResponse
}) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AttendanceMark | undefined>(
    toMark(record.status),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setStatus(toMark(record.status))
      setError(null)
    }
  }, [open, record.status])

  const updateAttendance = useMutation({
    ...updateClassroomSessionAttendanceMutation(),
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
          : 'Could not update attendance. Try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!status) {
      setError('Choose present or absent.')
      return
    }
    if (status === record.status) {
      onOpenChange(false)
      return
    }
    setError(null)
    updateAttendance.mutate({
      path: {
        classroomId,
        sessionId,
        attendanceId: record.id,
      },
      body: { status },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Edit attendance</DialogTitle>
            <DialogDescription>
              Update {member.name}&apos;s mark for this session.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="attendance-status">Status</Label>
            <Select
              value={status}
              disabled={updateAttendance.isPending}
              onValueChange={(value) => {
                if (value !== 'ATTENDED' && value !== 'ABSENT') {
                  return
                }
                setError(null)
                setStatus(value)
              }}
            >
              <SelectTrigger
                id="attendance-status"
                aria-label={`Attendance for ${member.name}`}
              >
                <SelectValue placeholder="Mark" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ATTENDED">Present</SelectItem>
                <SelectItem value="ABSENT">Absent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              disabled={updateAttendance.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateAttendance.isPending || !status}>
              {updateAttendance.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Save'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
