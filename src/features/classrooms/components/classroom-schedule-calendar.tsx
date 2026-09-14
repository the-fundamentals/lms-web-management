import { useEffect, useMemo, useRef, useState } from 'react'
import type { ClassroomScheduleResponse } from '@the-fundamentals/core-openapi'
import FullCalendar from '@fullcalendar/react'
import type {
  CalendarRef,
  DatesSetInfo,
  DayCellInfo,
  EventClickInfo,
  EventInput,
} from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import themePlugin from '@fullcalendar/react/themes/monarch'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import 'temporal-polyfill/global'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover'
import { expandScheduleOccurrences } from '@/features/classrooms/lib/expand-schedule-occurrences'
import { toLocalDateTimeIso } from '@/features/classrooms/lib/schedule-rule'
import { cn } from '@/lib/utils'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'

type ScheduleView = 'timeGridWeek' | 'dayGridMonth'

function monthDayCellClass(info: DayCellInfo): string | undefined {
  if (info.view.type !== 'dayGridMonth') {
    return undefined
  }
  const classes: Array<string> = []
  if (info.isOther) {
    classes.push('is-other-month')
  }
  if (info.isToday) {
    classes.push('is-today')
  }
  return classes.length > 0 ? classes.join(' ') : undefined
}

function monthDayNumberClass(info: DayCellInfo): string | undefined {
  if (info.view.type === 'dayGridMonth' && info.isToday) {
    return 'is-today-number'
  }
  return undefined
}

type EventFlyout = {
  scheduleId: string
  title: string
  when: string
  rect: { top: number; left: number; width: number; height: number }
}

function toJsDate(value: unknown): Date {
  if (value instanceof Date) {
    return value
  }
  if (typeof value === 'number') {
    return new Date(value)
  }
  if (typeof value === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split('-').map(Number)
      return new Date(year, month - 1, day)
    }
    return new Date(value)
  }
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    if (typeof record.epochMilliseconds === 'number') {
      return new Date(record.epochMilliseconds)
    }
    if (typeof record.toInstant === 'function') {
      const instant = (
        record.toInstant as () => { epochMilliseconds: number }
      ).call(value)
      return new Date(instant.epochMilliseconds)
    }
    if (
      typeof record.year === 'number' &&
      typeof record.month === 'number' &&
      typeof record.day === 'number'
    ) {
      return new Date(
        record.year,
        record.month - 1,
        record.day,
        typeof record.hour === 'number' ? record.hour : 0,
        typeof record.minute === 'number' ? record.minute : 0,
        typeof record.second === 'number' ? record.second : 0,
      )
    }
  }
  return new Date()
}

export function ClassroomScheduleCalendar({
  schedules,
  onDeleteSchedule,
}: {
  schedules: readonly ClassroomScheduleResponse[]
  onDeleteSchedule: (scheduleId: string) => void
}) {
  const calendarRef = useRef<CalendarRef>(null)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<ScheduleView>('timeGridWeek')
  const [title, setTitle] = useState('')
  const [flyout, setFlyout] = useState<EventFlyout | null>(null)
  const [range, setRange] = useState(() => {
    const start = new Date()
    start.setDate(start.getDate() - 7)
    const end = new Date()
    end.setDate(end.getDate() + 14)
    return { start, end }
  })

  useEffect(() => {
    setMounted(true)
  }, [])

  const events = useMemo<Array<EventInput>>(() => {
    return expandScheduleOccurrences(schedules, range).map((occurrence) => ({
      id: occurrence.id,
      title: occurrence.title,
      start: toLocalDateTimeIso(occurrence.start),
      end: toLocalDateTimeIso(occurrence.end),
      extendedProps: { scheduleId: occurrence.scheduleId },
    }))
  }, [schedules, range])

  function handleDatesSet(info: DatesSetInfo) {
    setTitle(info.view.title)
    const nextView = info.view.type
    if (nextView === 'timeGridWeek' || nextView === 'dayGridMonth') {
      setView(nextView)
    }
    setRange((current) => {
      const start = toJsDate(info.start)
      const end = toJsDate(info.end)
      if (
        current.start.getTime() === start.getTime() &&
        current.end.getTime() === end.getTime()
      ) {
        return current
      }
      return { start, end }
    })
  }

  function handleEventClick(info: EventClickInfo) {
    info.jsEvent.preventDefault()
    info.jsEvent.stopPropagation()
    const scheduleId = info.event.extendedProps.scheduleId
    if (typeof scheduleId !== 'string') {
      return
    }
    const rect = info.el.getBoundingClientRect()
    const when = new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    }).format(info.event.start ?? toJsDate(info.event.startStr))
    const next: EventFlyout = {
      scheduleId,
      title: info.event.title,
      when,
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
    }
    // Open after this click so the popover does not treat it as an outside dismiss.
    window.setTimeout(() => {
      setFlyout((current) =>
        current?.scheduleId === next.scheduleId &&
        current.rect.top === next.rect.top &&
        current.rect.left === next.rect.left
          ? null
          : next,
      )
    }, 0)
  }

  function changeView(next: ScheduleView) {
    setFlyout(null)
    calendarRef.current?.getApi().changeView(next)
    setView(next)
  }

  if (!mounted) {
    return (
      <div className="classroom-schedule-calendar min-h-[36rem] rounded-xl border bg-card" />
    )
  }

  return (
    <div className="classroom-schedule-calendar flex min-h-[36rem] flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous"
            onClick={() => {
              setFlyout(null)
              calendarRef.current?.getApi().prev()
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next"
            onClick={() => {
              setFlyout(null)
              calendarRef.current?.getApi().next()
            }}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setFlyout(null)
              calendarRef.current?.getApi().today()
            }}
          >
            Today
          </Button>
          <p className="ml-2 text-sm font-medium tracking-tight">{title}</p>
        </div>
        <div
          className="inline-flex rounded-lg border bg-muted/50 p-0.5"
          role="group"
          aria-label="Calendar view"
        >
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'timeGridWeek'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={view === 'timeGridWeek'}
            onClick={() => changeView('timeGridWeek')}
          >
            Week
          </button>
          <button
            type="button"
            className={cn(
              'rounded-md px-3 py-1 text-xs font-medium transition-colors',
              view === 'dayGridMonth'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
            aria-pressed={view === 'dayGridMonth'}
            onClick={() => changeView('dayGridMonth')}
          >
            Month
          </button>
        </div>
      </div>

      <Popover
        modal={false}
        open={flyout !== null}
        onOpenChange={(open) => {
          if (!open) {
            setFlyout(null)
          }
        }}
      >
        {flyout ? (
          <PopoverAnchor asChild>
            <span
              className="pointer-events-none fixed z-40"
              style={{
                top: flyout.rect.top,
                left: flyout.rect.left,
                width: flyout.rect.width,
                height: flyout.rect.height,
              }}
            />
          </PopoverAnchor>
        ) : null}
        {flyout ? (
          <PopoverContent
            side="right"
            align="start"
            collisionPadding={12}
            className="w-52 gap-2 p-2.5"
            onOpenAutoFocus={(event) => event.preventDefault()}
          >
            <PopoverHeader>
              <PopoverTitle>{flyout.title}</PopoverTitle>
              <PopoverDescription>{flyout.when}</PopoverDescription>
            </PopoverHeader>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                const scheduleId = flyout.scheduleId
                setFlyout(null)
                onDeleteSchedule(scheduleId)
              }}
            >
              Delete schedule
            </Button>
          </PopoverContent>
        ) : null}
      </Popover>

      <div className="flex h-[min(70vh,44rem)] min-h-[36rem] flex-col overflow-hidden rounded-xl border bg-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          height="100%"
          expandRows
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          nowIndicator
          displayEventTime={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          scrollTime="08:00:00"
          allDaySlot={false}
          dayHeaderFormat={{
            weekday: 'short',
            day: 'numeric',
          }}
          dayCellClass={monthDayCellClass}
          dayCellTopInnerClass={monthDayNumberClass}
        />
      </div>
    </div>
  )
}
