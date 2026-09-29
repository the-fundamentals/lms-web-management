import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import type {
  CalendarRef,
  DatesSetInfo,
  DayCellInfo,
  DayHeaderInfo,
  EventClickInfo,
  EventInput,
} from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import themePlugin from '@fullcalendar/react/themes/monarch'
import type { ClassroomSessionResponse } from '@the-fundamentals/core-openapi'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
} from 'lucide-react'
import 'temporal-polyfill/global'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from '@/components/ui/popover'
import { AddAdhocSessionDialog } from '@/features/classrooms/components/add-adhoc-session-dialog'
import { RecurringSchedulesDialog } from '@/features/classrooms/components/recurring-schedules-dialog'
import { getAllClassroomSessionsOptions } from '@/features/classrooms/classrooms-query'
import { cn } from '@/lib/utils'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'

type ScheduleView = 'timeGridWeek' | 'dayGridMonth'

type VisibleRange = {
  from: string
  to: string
}

function monthDayCellClass(info: DayCellInfo): string | undefined {
  if (info.view.type === 'dayGridMonth' && info.isOther) {
    return 'is-other-month'
  }
  return undefined
}

function weekDayHeaderContent(info: DayHeaderInfo) {
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
      <span>{info.weekdayText}</span>
      <span className={info.isToday ? 'is-today-number' : undefined}>
        {info.dayNumberText}
      </span>
    </span>
  )
}

function monthDayNumberClass(info: DayCellInfo): string | undefined {
  if (info.view.type === 'dayGridMonth' && info.isToday) {
    return 'is-today-number'
  }
  return undefined
}

function toDateKey(isoLike: string): string {
  return isoLike.slice(0, 10)
}

function toEventDateTime(sessionDate: string, time: string): string {
  const normalized = time.length === 5 ? `${time}:00` : time
  return `${sessionDate}T${normalized}`
}

type SessionPopover = {
  title: string
  description: string
  rect: DOMRect
}

function sessionToEvent(session: ClassroomSessionResponse): EventInput {
  const title =
    session.name?.trim() || (session.type === 'ADHOC' ? 'Adhoc' : 'Session')
  return {
    id: session.id,
    title,
    start: toEventDateTime(session.sessionDate, session.startTime),
    end: toEventDateTime(session.sessionDate, session.endTime),
    extendedProps: {
      description: session.description?.trim() ?? '',
    },
  }
}

export function ClassroomScheduleCalendar({
  classroomId,
}: {
  classroomId: string
}) {
  const calendarRef = useRef<CalendarRef>(null)
  const [mounted, setMounted] = useState(false)
  const [view, setView] = useState<ScheduleView>('timeGridWeek')
  const [title, setTitle] = useState('')
  const [isAddAdhocOpen, setIsAddAdhocOpen] = useState(false)
  const [isRecurrencesOpen, setIsRecurrencesOpen] = useState(false)
  const [visibleRange, setVisibleRange] = useState<VisibleRange | null>(null)
  const [sessionPopover, setSessionPopover] = useState<SessionPopover | null>(
    null,
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data: sessions = [] } = useQuery({
    ...getAllClassroomSessionsOptions({
      path: { classroomId },
      body: {
        page: 0,
        // API max page size; enough for POC week/month views.
        size: 50,
        sortBy: 'sessionDate',
        sortDirection: 'ASC',
        filters: visibleRange
          ? [
              {
                field: 'sessionDate',
                operator: 'gte',
                value: visibleRange.from,
              },
              {
                field: 'sessionDate',
                operator: 'lt',
                value: visibleRange.to,
              },
            ]
          : [],
      },
    }),
    enabled: Boolean(visibleRange),
  })

  const events = sessions.map(sessionToEvent)

  function handleDatesSet(info: DatesSetInfo) {
    setTitle(info.view.title)
    const nextView = info.view.type
    if (nextView === 'timeGridWeek' || nextView === 'dayGridMonth') {
      setView(nextView)
    }
    // FullCalendar `end` / `endStr` is exclusive — match with sessionDate `lt`.
    setVisibleRange({
      from: toDateKey(info.startStr),
      to: toDateKey(info.endStr),
    })
    setSessionPopover(null)
  }

  function handleEventClick(info: EventClickInfo) {
    info.jsEvent.preventDefault()
    const description =
      typeof info.event.extendedProps.description === 'string'
        ? info.event.extendedProps.description
        : ''
    setSessionPopover({
      title: info.event.title,
      description,
      rect: info.el.getBoundingClientRect(),
    })
  }

  function changeView(next: ScheduleView) {
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
              calendarRef.current?.getApi().today()
            }}
          >
            Today
          </Button>
          <p className="ml-2 text-sm font-medium tracking-tight">{title}</p>
        </div>
        <div className="flex items-center gap-2">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Schedule actions"
              >
                <EllipsisVerticalIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-44">
              <DropdownMenuItem onSelect={() => setIsAddAdhocOpen(true)}>
                Add adhoc session
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsRecurrencesOpen(true)}>
                Show recurring schedules
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <AddAdhocSessionDialog
        open={isAddAdhocOpen}
        onOpenChange={setIsAddAdhocOpen}
        classroomId={classroomId}
      />
      <RecurringSchedulesDialog
        open={isRecurrencesOpen}
        onOpenChange={setIsRecurrencesOpen}
        classroomId={classroomId}
      />

      <div className="rounded-xl border bg-card">
        <FullCalendar
          ref={calendarRef}
          plugins={[themePlugin, dayGridPlugin, timeGridPlugin]}
          initialView="timeGridWeek"
          headerToolbar={false}
          height="auto"
          events={events}
          datesSet={handleDatesSet}
          eventClick={handleEventClick}
          eventClass="is-session-event"
          nowIndicator
          displayEventTime={false}
          slotMinTime="00:00:00"
          slotMaxTime="24:00:00"
          slotMinHeight={16}
          scrollTime="08:00:00"
          allDaySlot={false}
          dayHeaderFormat={{
            weekday: 'short',
            day: 'numeric',
          }}
          dayHeaderContent={
            view === 'timeGridWeek' ? weekDayHeaderContent : undefined
          }
          dayCellClass={monthDayCellClass}
          dayCellTopInnerClass={monthDayNumberClass}
        />
      </div>

      <Popover
        open={sessionPopover !== null}
        onOpenChange={(open) => {
          if (!open) {
            setSessionPopover(null)
          }
        }}
      >
        {sessionPopover ? (
          <PopoverAnchor asChild>
            <span
              aria-hidden
              className="pointer-events-none fixed"
              style={{
                top: sessionPopover.rect.top,
                left: sessionPopover.rect.left,
                width: sessionPopover.rect.width,
                height: sessionPopover.rect.height,
              }}
            />
          </PopoverAnchor>
        ) : null}
        <PopoverContent side="right" align="start" className="w-72">
          <PopoverHeader>
            <PopoverTitle>{sessionPopover?.title}</PopoverTitle>
            <PopoverDescription>
              {sessionPopover?.description || 'No description'}
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  )
}
