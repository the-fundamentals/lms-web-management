import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { RecurrenceByDay } from '@the-fundamentals/core-openapi'
import {
  createClassroomScheduleRecurrenceMutation,
  createClassroomSessionMutation,
  getAllClassroomScheduleRecurrencesQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import { CalendarDaysIcon, ClockIcon, Loader2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from '@/components/ui/popover'
import { invalidateClassroomSessionsQueries } from '@/features/classrooms/classrooms-query'
import { cn } from '@/lib/utils'

export type AdhocSessionDefaults = {
  sessionDate: string
  startTime: string
  endTime: string
}

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
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
}

const JS_DAY_TO_RECURRENCE: RecurrenceByDay[] = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
]

/** Noon local avoids UTC date-shift for YYYY-MM-DD calendar values. */
function weekdayFromDate(isoDate: string): RecurrenceByDay | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return null
  }
  const date = new Date(`${isoDate}T12:00:00`)
  if (Number.isNaN(date.getTime())) {
    return null
  }
  return JS_DAY_TO_RECURRENCE[date.getDay()] ?? null
}

type FormState = AdhocSessionDefaults & {
  name: string
  description: string
  isRecurring: boolean
  byDays: RecurrenceByDay[]
  recurUntil: string
}

const EMPTY_FORM: FormState = {
  sessionDate: '',
  startTime: '',
  endTime: '',
  name: '',
  description: '',
  isRecurring: false,
  byDays: [],
  recurUntil: '',
}

function formFromDefaults(defaults?: AdhocSessionDefaults | null): FormState {
  if (!defaults) {
    return EMPTY_FORM
  }
  const weekday = weekdayFromDate(defaults.sessionDate)
  return {
    ...EMPTY_FORM,
    sessionDate: defaults.sessionDate,
    startTime: defaults.startTime,
    endTime: defaults.endTime,
    byDays: weekday ? [weekday] : [],
  }
}

function AddAdhocSessionForm({
  classroomId,
  defaults,
  open,
  onOpenChange,
  onCreated,
  variant,
  allowRecurring = false,
  /** Which side of the session block the popover sits on — accent border faces the block. */
  placementSide = 'right',
}: {
  classroomId: string
  defaults?: AdhocSessionDefaults | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated?: () => void
  variant: 'dialog' | 'popover'
  allowRecurring?: boolean
  placementSide?: 'left' | 'right'
}) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<FormState>(() => formFromDefaults(defaults))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM)
      setError(null)
      return
    }
    setForm(formFromDefaults(defaults))
    setError(null)
  }, [open, defaults])

  function finishCreate() {
    invalidateClassroomSessionsQueries(queryClient)
    onCreated?.()
    onOpenChange(false)
  }

  const createSession = useMutation({
    ...createClassroomSessionMutation(),
    onSuccess: () => {
      finishCreate()
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the session. Try again.',
      )
    },
  })

  const createRecurrence = useMutation({
    ...createClassroomScheduleRecurrenceMutation(),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: getAllClassroomScheduleRecurrencesQueryKey({
          path: { classroomId },
        }),
      })
      finishCreate()
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not create the recurring schedule. Try again.',
      )
    },
  })

  const isPending = createSession.isPending || createRecurrence.isPending

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const sessionDate = form.sessionDate.trim()
    const startTime = form.startTime.trim()
    const endTime = form.endTime.trim()
    const name = form.name.trim()
    const description = form.description.trim()
    const recurUntil = form.recurUntil.trim()

    if (!sessionDate || !startTime || !endTime) {
      setError('Date, start time, and end time are required.')
      return
    }

    if (endTime <= startTime) {
      setError('End time must be after start time.')
      return
    }

    if (allowRecurring && form.isRecurring) {
      if (form.byDays.length === 0) {
        setError('Select at least one weekday for the recurring schedule.')
        return
      }
      if (recurUntil && recurUntil < sessionDate) {
        setError('Until date must be on or after the start date.')
        return
      }

      createRecurrence.mutate({
        path: { classroomId },
        body: {
          frequency: 'WEEKLY',
          byDays: form.byDays,
          recurrenceStartDate: sessionDate,
          startTime,
          endTime,
          ...(recurUntil ? { recurUntil } : {}),
          ...(name ? { name } : {}),
          ...(description ? { description } : {}),
        },
      })
      return
    }

    createSession.mutate({
      path: { classroomId },
      body: {
        sessionDate,
        startTime,
        endTime,
        ...(name ? { name } : {}),
        ...(description ? { description } : {}),
      },
    })
  }

  function setSessionDate(nextDate: string) {
    setError(null)
    setForm((current) => {
      const weekday = weekdayFromDate(nextDate)
      const nextByDays =
        current.isRecurring && weekday
          ? current.byDays.includes(weekday)
            ? current.byDays
            : [...current.byDays, weekday]
          : weekday
            ? [weekday]
            : current.byDays
      return {
        ...current,
        sessionDate: nextDate,
        byDays: nextByDays,
      }
    })
  }

  function toggleRecurring(checked: boolean) {
    setError(null)
    setForm((current) => {
      const weekday = weekdayFromDate(current.sessionDate)
      return {
        ...current,
        isRecurring: checked,
        byDays:
          checked && weekday
            ? current.byDays.length > 0
              ? current.byDays
              : [weekday]
            : current.byDays,
        recurUntil: checked ? current.recurUntil : '',
      }
    })
  }

  function toggleDay(day: RecurrenceByDay) {
    setError(null)
    setForm((current) => {
      const selected = current.byDays.includes(day)
      return {
        ...current,
        byDays: selected
          ? current.byDays.filter((value) => value !== day)
          : [...current.byDays, day],
      }
    })
  }

  const whenInputClass =
    'h-8 min-w-0 w-full border-0 bg-transparent px-0 shadow-none tabular-nums focus-visible:ring-0 [&::-webkit-calendar-picker-indicator]:opacity-50'

  // Match TEMP calendar session colors: amber adhoc, violet schedule.
  const typeEdge = form.isRecurring
    ? 'border-[color:oklch(0.55_0.12_280)]'
    : 'border-[color:oklch(0.72_0.14_55)]'
  // Accent on the edge that faces the calendar block (flush to popover edge).
  const placementEdge =
    placementSide === 'left'
      ? '-mr-3 border-r-[3px] pr-3'
      : '-ml-3 border-l-[3px] pl-3'

  const fields = (
    <div
      className={cn(
        'flex min-w-0 flex-col gap-3',
        typeEdge,
        placementEdge,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
        <Label htmlFor={`adhoc-name-${variant}`} className="sr-only">
          Name
        </Label>
        <Input
          id={`adhoc-name-${variant}`}
          type="text"
          autoFocus
          placeholder="Add title"
          className="h-9 border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0"
          disabled={isPending}
          value={form.name}
          onChange={(event) => {
            setError(null)
            setForm((current) => ({
              ...current,
              name: event.target.value,
            }))
          }}
        />
        <Label htmlFor={`adhoc-description-${variant}`} className="sr-only">
          Description
        </Label>
        <Input
          id={`adhoc-description-${variant}`}
          type="text"
          placeholder="Add description"
          className="h-8 border-0 bg-transparent px-0 text-sm text-muted-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
          disabled={isPending}
          value={form.description}
          onChange={(event) => {
            setError(null)
            setForm((current) => ({
              ...current,
              description: event.target.value,
            }))
          }}
        />
      </div>

      {/* Schedule strip — date + time as sibling rows, no nested card. */}
      <div className="flex min-w-0 flex-col">
        <div className="flex min-w-0 items-center gap-3 py-1.5">
          <CalendarDaysIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <Label htmlFor={`adhoc-date-${variant}`} className="sr-only">
              {form.isRecurring ? 'Starts' : 'Date'}
            </Label>
            <Input
              id={`adhoc-date-${variant}`}
              type="date"
              required
              className={whenInputClass}
              disabled={isPending}
              value={form.sessionDate}
              onChange={(event) => {
                setSessionDate(event.target.value)
              }}
            />
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3 py-1.5">
          <ClockIcon
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="grid min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-1.5">
            <div className="min-w-0">
              <Label htmlFor={`adhoc-start-${variant}`} className="sr-only">
                Start
              </Label>
              <Input
                id={`adhoc-start-${variant}`}
                type="time"
                required
                className={whenInputClass}
                disabled={isPending}
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
            <span
              className="select-none text-muted-foreground/80"
              aria-hidden
            >
              –
            </span>
            <div className="min-w-0">
              <Label htmlFor={`adhoc-end-${variant}`} className="sr-only">
                End
              </Label>
              <Input
                id={`adhoc-end-${variant}`}
                type="time"
                required
                className={whenInputClass}
                disabled={isPending}
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
      </div>

      {allowRecurring ? (
        <div className="flex min-w-0 flex-col gap-2.5 border-t border-border/60 pt-3">
          <label
            htmlFor={`adhoc-recurring-${variant}`}
            className="flex cursor-pointer items-center gap-2 text-sm"
          >
            <Checkbox
              id={`adhoc-recurring-${variant}`}
              checked={form.isRecurring}
              disabled={isPending}
              onCheckedChange={(checked) => {
                toggleRecurring(checked === true)
              }}
            />
            <span>Make recurring</span>
          </label>

          {form.isRecurring ? (
            <div className="flex min-w-0 flex-col gap-2.5 pl-6">
              <fieldset className="flex min-w-0 flex-col gap-1.5">
                <legend className="sr-only">Repeats on</legend>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAYS.map((day) => {
                    const selected = form.byDays.includes(day)
                    return (
                      <button
                        key={day}
                        type="button"
                        disabled={isPending}
                        aria-pressed={selected}
                        className={cn(
                          'rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
                          selected
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                        onClick={() => toggleDay(day)}
                      >
                        {WEEKDAY_LABEL[day]}
                      </button>
                    )
                  })}
                </div>
              </fieldset>

              <div className="flex min-w-0 items-center gap-3">
                <span className="shrink-0 text-xs text-muted-foreground">
                  Until
                </span>
                <Label htmlFor={`adhoc-until-${variant}`} className="sr-only">
                  Until (optional)
                </Label>
                <Input
                  id={`adhoc-until-${variant}`}
                  type="date"
                  className={whenInputClass}
                  disabled={isPending}
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
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Creating…
            </>
          ) : form.isRecurring ? (
            'Create schedule'
          ) : (
            'Create'
          )}
        </Button>
      </div>
    </div>
  )

  if (variant === 'dialog') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Add adhoc session</DialogTitle>
          <DialogDescription>
            Create a one-off open session for this classroom.
          </DialogDescription>
        </DialogHeader>
        {fields}
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-1">
      {fields}
    </form>
  )
}

export function AddAdhocSessionDialog({
  open,
  onOpenChange,
  classroomId,
  defaults,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  defaults?: AdhocSessionDefaults | null
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AddAdhocSessionForm
          classroomId={classroomId}
          defaults={defaults}
          open={open}
          onOpenChange={onOpenChange}
          variant="dialog"
        />
      </DialogContent>
    </Dialog>
  )
}

export function AddAdhocSessionPopover({
  open,
  onOpenChange,
  classroomId,
  defaults,
  anchorRect,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  classroomId: string
  defaults: AdhocSessionDefaults | null
  anchorRect: DOMRect | null
  onCreated?: () => void
}) {
  // Prefer right of the block; only flip to left — never top/bottom.
  const side: 'left' | 'right' = (() => {
    if (!anchorRect) {
      return 'right'
    }
    const popoverWidth = 320
    const gap = 8
    const spaceRight = window.innerWidth - anchorRect.right - gap
    const spaceLeft = anchorRect.left - gap
    if (spaceRight >= popoverWidth) {
      return 'right'
    }
    if (spaceLeft >= popoverWidth) {
      return 'left'
    }
    return spaceRight >= spaceLeft ? 'right' : 'left'
  })()

  // Keep last anchor mounted while open=false so Radix exit doesn't fall back to 0,0.
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      {anchorRect ? (
        <PopoverAnchor asChild>
          <span
            aria-hidden
            className="pointer-events-none fixed"
            style={{
              top: anchorRect.top,
              left: anchorRect.left,
              width: Math.max(anchorRect.width, 8),
              height: Math.max(anchorRect.height, 8),
            }}
          />
        </PopoverAnchor>
      ) : null}
      <PopoverContent
        side={side}
        align="start"
        sideOffset={8}
        // We only allow left/right via `side` above — disable auto flip to top/bottom.
        avoidCollisions={false}
        className="w-80 max-w-[calc(100vw-2rem)] overflow-hidden p-3"
        onOpenAutoFocus={(event) => {
          // Avoid scroll-jank from focusing the title field immediately after select.
          event.preventDefault()
          const root = event.currentTarget
          if (!(root instanceof HTMLElement)) {
            return
          }
          root
            .querySelector<HTMLInputElement>('input[type="text"]')
            ?.focus({ preventScroll: true })
        }}
      >
        <AddAdhocSessionForm
          classroomId={classroomId}
          defaults={defaults}
          open={open}
          onOpenChange={onOpenChange}
          onCreated={onCreated}
          variant="popover"
          allowRecurring
          placementSide={side}
        />
      </PopoverContent>
    </Popover>
  )
}
