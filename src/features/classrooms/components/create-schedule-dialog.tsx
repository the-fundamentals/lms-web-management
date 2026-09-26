import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClassroomScheduleRecurrenceMutation,
  getAllClassroomScheduleRecurrencesQueryKey,
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  WEEKDAYS,
  firstOccurrenceDate,
  toIsoDateLocal,
  weekdayIcalForDate,
} from '@/features/classrooms/lib/schedule-rule'
import type { RecurrenceFreq } from '@/features/classrooms/lib/schedule-rule'
import { cn } from '@/lib/utils'

type EndsMode = 'never' | 'until' | 'count'

function frequencyUnitLabel(freq: RecurrenceFreq, interval: number): string {
  const plural = interval !== 1
  switch (freq) {
    case 'DAILY':
      return plural ? 'days' : 'day'
    case 'WEEKLY':
      return plural ? 'weeks' : 'week'
    case 'MONTHLY':
      return plural ? 'months' : 'month'
    case 'YEARLY':
      return plural ? 'years' : 'year'
  }
}

/** API LocalTime is HH:mm:ss; native time inputs are HH:mm. */
function toApiTime(hhmm: string): string {
  if (/^\d{2}:\d{2}:\d{2}$/.test(hhmm)) {
    return hhmm
  }
  return `${hhmm}:00`
}

export function CreateScheduleDialog({
  open,
  onOpenChange,
  classroomId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
}) {
  const queryClient = useQueryClient()
  const defaultWeekday = useMemo(() => weekdayIcalForDate(new Date()), [])
  const [interval, setInterval] = useState(1)
  const freq = 'WEEKLY' as const
  const [byDays, setByDays] = useState<ReadonlySet<string>>(
    () => new Set([defaultWeekday]),
  )
  const [startsOn, setStartsOn] = useState(() =>
    toIsoDateLocal(firstOccurrenceDate({ freq: 'WEEKLY', byDays: new Set([defaultWeekday]) })),
  )
  const [startsOnTouched, setStartsOnTouched] = useState(false)
  const [endsMode, setEndsMode] = useState<EndsMode>('never')
  const [untilDate, setUntilDate] = useState('')
  const [count, setCount] = useState(10)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      const weekday = weekdayIcalForDate(new Date())
      const nextDays = new Set([weekday])
      setInterval(1)
      setByDays(nextDays)
      setStartsOn(
        toIsoDateLocal(
          firstOccurrenceDate({ freq: 'WEEKLY', byDays: nextDays }),
        ),
      )
      setStartsOnTouched(false)
      setEndsMode('never')
      setUntilDate('')
      setCount(10)
      setStartTime('')
      setEndTime('')
      setError(null)
    }
  }, [open])

  useEffect(() => {
    if (!open || startsOnTouched) {
      return
    }
    setStartsOn(
      toIsoDateLocal(firstOccurrenceDate({ freq, byDays })),
    )
  }, [open, freq, byDays, startsOnTouched])

  const createSchedule = useMutation({
    ...createClassroomScheduleRecurrenceMutation(),
  })

  function toggleDay(ical: string) {
    setError(null)
    setByDays((current) => {
      const next = new Set(current)
      if (next.has(ical)) {
        next.delete(ical)
      } else {
        next.add(ical)
      }
      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!Number.isInteger(interval) || interval < 1) {
      setError('Repeat every must be at least 1.')
      return
    }

    // API frequency is WEEKLY with no interval. One row stores a single byDay.
    if (interval !== 1) {
      setError('Only every 1 week is supported.')
      return
    }

    if (byDays.size === 0) {
      setError('Choose at least one day.')
      return
    }

    if (!startsOn) {
      setError('Starts on is required.')
      return
    }

    if (endsMode === 'until' && !untilDate) {
      setError('Choose an end date.')
      return
    }

    if (endsMode === 'until' && untilDate < startsOn) {
      setError('End date must be on or after Starts on.')
      return
    }

    if (endsMode === 'count') {
      setError('Ending after a number of occurrences is not supported. Use an end date or never.')
      return
    }

    if (!startTime || !endTime) {
      setError('Start and end time are required.')
      return
    }

    const apiStartTime = toApiTime(startTime)
    const apiEndTime = toApiTime(endTime)

    if (apiEndTime <= apiStartTime) {
      setError('End time must be after start time.')
      return
    }

    const selectedDays = WEEKDAYS.filter((day) => byDays.has(day.ical))
    try {
      for (const day of selectedDays) {
        await createSchedule.mutateAsync({
          path: { classroomId },
          body: {
            frequency: 'WEEKLY',
            byDay: day.byDay,
            recurrenceStartDate: startsOn,
            ...(endsMode === 'until' ? { recurUntil: untilDate } : {}),
            startTime: apiStartTime,
            endTime: apiEndTime,
          },
        })
      }
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomScheduleRecurrencesQueryKey({
          path: { classroomId },
        }),
      })
      onOpenChange(false)
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create this schedule. Try again.',
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="grid gap-5"
        >
          <DialogHeader>
            <DialogTitle>Custom recurrence</DialogTitle>
            <DialogDescription>
              Set how often this classroom meets, when the series starts, and
              when it stops.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-2">
            <Label htmlFor="schedule-interval">Repeat every</Label>
            <div className="flex items-center gap-2">
              <Input
                id="schedule-interval"
                type="number"
                min={1}
                step={1}
                required
                value={interval}
                disabled={createSchedule.isPending}
                className="w-20"
                onChange={(event) => {
                  setError(null)
                  setInterval(Number(event.target.value))
                }}
              />
              <Select value={freq} disabled={createSchedule.isPending}>
                <SelectTrigger className="min-w-28" aria-label="Repeat unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {/* Backend only accepts weekly RRULEs for now; keep other units visible but disabled. */}
                  <SelectItem value="DAILY" disabled>
                    {frequencyUnitLabel('DAILY', interval)}
                  </SelectItem>
                  <SelectItem value="WEEKLY">
                    {frequencyUnitLabel('WEEKLY', interval)}
                  </SelectItem>
                  <SelectItem value="MONTHLY" disabled>
                    {frequencyUnitLabel('MONTHLY', interval)}
                  </SelectItem>
                  <SelectItem value="YEARLY" disabled>
                    {frequencyUnitLabel('YEARLY', interval)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Repeat on</Label>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => {
                const selected = byDays.has(day.ical)
                return (
                  <button
                    key={day.ical}
                    type="button"
                    aria-pressed={selected}
                    aria-label={day.ical}
                    disabled={createSchedule.isPending}
                    onClick={() => toggleDay(day.ical)}
                    className={cn(
                      'size-9 rounded-full text-xs font-medium',
                      selected
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {day.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-starts-on">Starts on</Label>
            <Input
              id="schedule-starts-on"
              type="date"
              required
              value={startsOn}
              disabled={createSchedule.isPending}
              onChange={(event) => {
                setError(null)
                setStartsOnTouched(true)
                setStartsOn(event.target.value)
              }}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="schedule-ends">Ends</Label>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={endsMode}
                onValueChange={(value) => {
                  setError(null)
                  setEndsMode(value as EndsMode)
                }}
                disabled={createSchedule.isPending}
              >
                <SelectTrigger id="schedule-ends" className="min-w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="until">On date</SelectItem>
                  <SelectItem value="count">After</SelectItem>
                </SelectContent>
              </Select>
              {endsMode === 'until' ? (
                <Input
                  type="date"
                  required
                  min={startsOn}
                  value={untilDate}
                  disabled={createSchedule.isPending}
                  aria-label="Until date"
                  onChange={(event) => {
                    setError(null)
                    setUntilDate(event.target.value)
                  }}
                />
              ) : null}
              {endsMode === 'count' ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={count}
                    disabled={createSchedule.isPending}
                    className="w-20"
                    aria-label="Occurrence count"
                    onChange={(event) => {
                      setError(null)
                      setCount(Number(event.target.value))
                    }}
                  />
                  <span className="text-sm text-muted-foreground">
                    times
                  </span>
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="schedule-start-time">Start</Label>
              <Input
                id="schedule-start-time"
                type="time"
                required
                value={startTime}
                disabled={createSchedule.isPending}
                onChange={(event) => {
                  setError(null)
                  setStartTime(event.target.value)
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="schedule-end-time">End</Label>
              <Input
                id="schedule-end-time"
                type="time"
                required
                value={endTime}
                disabled={createSchedule.isPending}
                onChange={(event) => {
                  setError(null)
                  setEndTime(event.target.value)
                }}
              />
            </div>
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
              disabled={createSchedule.isPending}
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createSchedule.isPending}>
              {createSchedule.isPending ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Saving…
                </>
              ) : (
                'Done'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
