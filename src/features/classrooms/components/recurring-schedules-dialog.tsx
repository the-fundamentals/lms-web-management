import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { RecurrenceByDay } from '@the-fundamentals/core-openapi'
import {
  createClassroomScheduleRecurrenceMutation,
  getAllClassroomScheduleRecurrencesOptions,
  getAllClassroomScheduleRecurrencesQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { Loader2Icon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const WEEKDAYS: RecurrenceByDay[] = [
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
  'SUNDAY',
]

const WEEKDAY_LABEL: Record<RecurrenceByDay, string> = {
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
  SUNDAY: 'Sunday',
}

function formatTime(value: string): string {
  return value.slice(0, 5)
}

type AddFormState = {
  byDay: RecurrenceByDay | ''
  recurrenceStartDate: string
  recurUntil: string
  startTime: string
  endTime: string
}

const EMPTY_ADD_FORM: AddFormState = {
  byDay: '',
  recurrenceStartDate: '',
  recurUntil: '',
  startTime: '',
  endTime: '',
}

function AddRecurrenceDialog({
  open,
  onOpenChange,
  classroomId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<AddFormState>(EMPTY_ADD_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_ADD_FORM)
      setError(null)
    }
  }, [open])

  const createRecurrence = useMutation({
    ...createClassroomScheduleRecurrenceMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomScheduleRecurrencesQueryKey({
          path: { classroomId },
        }),
      })
      onOpenChange(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the recurrence. Try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const { byDay, recurrenceStartDate, recurUntil, startTime, endTime } = form

    if (!byDay || !recurrenceStartDate || !startTime || !endTime) {
      setError('Weekday, start date, start time, and end time are required.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    if (recurUntil && recurUntil < recurrenceStartDate) {
      setError('Until date must be on or after the start date.')
      return
    }

    createRecurrence.mutate({
      path: { classroomId },
      body: {
        frequency: 'WEEKLY',
        byDay,
        recurrenceStartDate,
        startTime,
        endTime,
        ...(recurUntil ? { recurUntil } : {}),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>Add recurring schedule</DialogTitle>
            <DialogDescription>
              Weekly recurrence. Sessions are generated from this later.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="recurrence-by-day">Weekday</Label>
              <Select
                value={form.byDay || undefined}
                disabled={createRecurrence.isPending}
                onValueChange={(value) => {
                  setError(null)
                  setForm((current) => ({
                    ...current,
                    byDay: value as RecurrenceByDay,
                  }))
                }}
              >
                <SelectTrigger id="recurrence-by-day" className="w-full">
                  <SelectValue placeholder="Select a weekday" />
                </SelectTrigger>
                <SelectContent>
                  {WEEKDAYS.map((day) => (
                    <SelectItem key={day} value={day}>
                      {WEEKDAY_LABEL[day]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurrence-start-date">Starts</Label>
                <Input
                  id="recurrence-start-date"
                  type="date"
                  required
                  disabled={createRecurrence.isPending}
                  value={form.recurrenceStartDate}
                  onChange={(event) => {
                    setError(null)
                    setForm((current) => ({
                      ...current,
                      recurrenceStartDate: event.target.value,
                    }))
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurrence-until">Until (optional)</Label>
                <Input
                  id="recurrence-until"
                  type="date"
                  disabled={createRecurrence.isPending}
                  value={form.recurUntil}
                  onChange={(event) => {
                    setError(null)
                    setForm((current) => ({
                      ...current,
                      recurUntil: event.target.value,
                    }))
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurrence-start-time">Start</Label>
                <Input
                  id="recurrence-start-time"
                  type="time"
                  required
                  disabled={createRecurrence.isPending}
                  value={form.startTime}
                  onChange={(event) => {
                    setError(null)
                    setForm((current) => ({
                      ...current,
                      startTime: event.target.value,
                    }))
                  }}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="recurrence-end-time">End</Label>
                <Input
                  id="recurrence-end-time"
                  type="time"
                  required
                  disabled={createRecurrence.isPending}
                  value={form.endTime}
                  onChange={(event) => {
                    setError(null)
                    setForm((current) => ({
                      ...current,
                      endTime: event.target.value,
                    }))
                  }}
                />
              </div>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <DialogFooter>
            <Button type="submit" disabled={createRecurrence.isPending}>
              {createRecurrence.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Creating…
                </>
              ) : (
                'Create recurrence'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RecurringSchedulesDialog({
  open,
  onOpenChange,
  classroomId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
}) {
  const [isAddOpen, setIsAddOpen] = useState(false)

  const { data = [], isPending, isError, error, refetch, isFetching } = useQuery({
    ...getAllClassroomScheduleRecurrencesOptions({
      path: { classroomId },
    }),
    enabled: open,
  })

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Recurring schedules</DialogTitle>
            <DialogDescription>
              Weekly recurrences for this classroom.
            </DialogDescription>
          </DialogHeader>

          {isPending ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Loading…
            </p>
          ) : isError ? (
            <div className="flex flex-col items-center gap-3 py-6">
              <p className="text-sm text-destructive" role="alert">
                {error instanceof Error
                  ? error.message
                  : 'Could not load recurrences.'}
              </p>
              <Button
                type="button"
                variant="outline"
                disabled={isFetching}
                onClick={() => void refetch()}
              >
                Try again
              </Button>
            </div>
          ) : data.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No recurring schedules yet.
            </p>
          ) : (
            <ul className="flex max-h-72 flex-col gap-1 overflow-y-auto">
              {data.map((recurrence) => (
                <li
                  key={recurrence.id}
                  className="rounded-md px-2 py-2.5 text-sm hover:bg-muted/60"
                >
                  <p className="font-medium">
                    {WEEKDAY_LABEL[recurrence.byDay]}{' '}
                    {formatTime(recurrence.startTime)}–
                    {formatTime(recurrence.endTime)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    From {recurrence.recurrenceStartDate}
                    {recurrence.recurUntil
                      ? ` until ${recurrence.recurUntil}`
                      : ' · no end'}
                  </p>
                </li>
              ))}
            </ul>
          )}

          <DialogFooter>
            <Button type="button" onClick={() => setIsAddOpen(true)}>
              <PlusIcon className="size-4" aria-hidden />
              Add recurring schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddRecurrenceDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        classroomId={classroomId}
      />
    </>
  )
}
