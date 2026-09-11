import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  createClassroomScheduleMutation,
  getAllClassroomSchedulesQueryKey,
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
import { cn } from '@/lib/utils'

type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

const WEEKDAYS = [
  { ical: 'SU', label: 'S' },
  { ical: 'MO', label: 'M' },
  { ical: 'TU', label: 'T' },
  { ical: 'WE', label: 'W' },
  { ical: 'TH', label: 'T' },
  { ical: 'FR', label: 'F' },
  { ical: 'SA', label: 'S' },
] as const

function weekdayIcalForDate(date: Date): (typeof WEEKDAYS)[number]['ical'] {
  return WEEKDAYS[date.getDay()].ical
}

function frequencyUnitLabel(freq: RecurrenceFreq, interval: number): string {
  const plural = interval === 1 ? false : true
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

function buildScheduleRule({
  freq,
  interval,
  byDays,
}: {
  freq: RecurrenceFreq
  interval: number
  byDays: ReadonlySet<string>
}): string {
  const parts = [`FREQ=${freq}`, `INTERVAL=${interval}`]
  if (freq === 'WEEKLY') {
    const ordered = WEEKDAYS.map((day) => day.ical).filter((ical) =>
      byDays.has(ical),
    )
    parts.push(`BYDAY=${ordered.join(',')}`)
  }
  return parts.join(';')
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
  const [freq, setFreq] = useState<RecurrenceFreq>('WEEKLY')
  const [byDays, setByDays] = useState<ReadonlySet<string>>(
    () => new Set([defaultWeekday]),
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setInterval(1)
      setFreq('WEEKLY')
      setByDays(new Set([weekdayIcalForDate(new Date())]))
      setError(null)
    }
  }, [open])

  const createSchedule = useMutation({
    ...createClassroomScheduleMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomSchedulesQueryKey({
          path: { classroomId },
        }),
      })
      onOpenChange(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create this schedule. Try again.',
      )
    },
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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    if (!Number.isInteger(interval) || interval < 1) {
      setError('Repeat every must be at least 1.')
      return
    }

    if (freq === 'WEEKLY' && byDays.size === 0) {
      setError('Choose at least one day.')
      return
    }

    createSchedule.mutate({
      path: { classroomId },
      body: {
        scheduleRule: buildScheduleRule({ freq, interval, byDays }),
      },
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit} className="grid gap-5">
          <DialogHeader>
            <DialogTitle>Custom recurrence</DialogTitle>
            <DialogDescription>
              Set how often this classroom repeats. This is saved as an iCal
              recurrence rule.
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
              <Select
                value={freq}
                onValueChange={(value) => {
                  setError(null)
                  setFreq(value as RecurrenceFreq)
                }}
                disabled={createSchedule.isPending}
              >
                <SelectTrigger className="min-w-28" aria-label="Repeat unit">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DAILY">
                    {frequencyUnitLabel('DAILY', interval)}
                  </SelectItem>
                  <SelectItem value="WEEKLY">
                    {frequencyUnitLabel('WEEKLY', interval)}
                  </SelectItem>
                  <SelectItem value="MONTHLY">
                    {frequencyUnitLabel('MONTHLY', interval)}
                  </SelectItem>
                  <SelectItem value="YEARLY">
                    {frequencyUnitLabel('YEARLY', interval)}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {freq === 'WEEKLY' ? (
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
          ) : null}

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
