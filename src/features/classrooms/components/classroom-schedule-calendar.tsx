import { useEffect, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import type {
  ClassroomSessionResponse,
  ClassroomSessionStatus,
  ClassroomSessionType,
} from '@the-fundamentals/core-openapi'
import { updateClassroomSessionMutation, cancelClassroomSessionMutation } from '@the-fundamentals/core-openapi/react-query'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  Loader2Icon,
  PencilIcon,
} from 'lucide-react'
import 'temporal-polyfill/global'

import { useConfirmAction } from '@/components/confirm-action'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  SessionAttendanceSheet,
  type SessionAttendanceTarget,
} from '@/features/classrooms/components/session-attendance-sheet'
import {
  getAllClassroomSessionsOptions,
  invalidateClassroomSessionsQueries,
} from '@/features/classrooms/classrooms-query'
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
  sessionId: string
  status: ClassroomSessionStatus
  type: ClassroomSessionType
  name: string
  description: string
  sessionDate: string
  startTime: string
  endTime: string
  rect: DOMRect
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

function SessionMetaBadge({
  children,
  className,
}: {
  children: ReactNode
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

function sessionToEvent(session: ClassroomSessionResponse): EventInput {
  return {
    id: session.id,
    title: sessionDisplayTitle(session.name, session.type),
    start: toEventDateTime(session.sessionDate, session.startTime),
    end: toEventDateTime(session.sessionDate, session.endTime),
    extendedProps: {
      name: session.name?.trim() ?? '',
      description: session.description?.trim() ?? '',
      status: session.status,
      type: session.type,
      sessionDate: session.sessionDate,
      startTime: session.startTime,
      endTime: session.endTime,
    },
  }
}

function SessionPopoverPanel({
  classroomId,
  session,
  onSessionChange,
  onOpenSession,
}: {
  classroomId: string
  session: SessionPopover
  onSessionChange: (
    next: Partial<Pick<SessionPopover, 'name' | 'description' | 'status'>>,
  ) => void
  onOpenSession: () => void
}) {
  const queryClient = useQueryClient()
  const confirmAction = useConfirmAction()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(session.name)
  const [description, setDescription] = useState(session.description)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsEditing(false)
    setError(null)
    setName(session.name)
    setDescription(session.description)
  }, [session.sessionId, session.name, session.description])

  const updateSession = useMutation({
    ...updateClassroomSessionMutation(),
    onSuccess: (updated) => {
      invalidateClassroomSessionsQueries(queryClient)
      onSessionChange({
        name: updated.name?.trim() ?? '',
        description: updated.description?.trim() ?? '',
      })
      setIsEditing(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not update the session. Try again.',
      )
    },
  })

  const cancelSession = useMutation({
    ...cancelClassroomSessionMutation(),
    onSuccess: (updated) => {
      invalidateClassroomSessionsQueries(queryClient)
      onSessionChange({ status: updated.status })
      setIsEditing(false)
    },
    onError: (cause) => {
      setError(
        cause instanceof Error
          ? cause.message
          : 'Could not cancel the session. Try again.',
      )
    },
  })

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    updateSession.mutate({
      path: { classroomId, sessionId: session.sessionId },
      body: {
        name: name.trim(),
        description: description.trim(),
      },
    })
  }

  if (isEditing) {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
        <div className="flex flex-col gap-1">
          <Label htmlFor="session-edit-name">Name</Label>
          <Input
            id="session-edit-name"
            value={name}
            disabled={updateSession.isPending}
            onChange={(event) => {
              setError(null)
              setName(event.target.value)
            }}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="session-edit-description">Description</Label>
          <Input
            id="session-edit-description"
            value={description}
            disabled={updateSession.isPending}
            onChange={(event) => {
              setError(null)
              setDescription(event.target.value)
            }}
          />
        </div>
        {error ? (
          <p className="text-xs text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <Button
          type="submit"
          size="sm"
          disabled={updateSession.isPending || cancelSession.isPending}
        >
          {updateSession.isPending ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              Saving…
            </>
          ) : (
            'Save'
          )}
        </Button>
      </form>
    )
  }

  return (
    <div className="flex flex-col gap-2.5">
      <PopoverHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <div className="flex flex-wrap items-center gap-1.5">
              <SessionMetaBadge className={STATUS_BADGE_CLASS[session.status]}>
                {session.status}
              </SessionMetaBadge>
              <SessionMetaBadge className="bg-muted text-muted-foreground">
                {session.type === 'ADHOC' ? 'Adhoc' : 'Schedule'}
              </SessionMetaBadge>
            </div>
            <PopoverTitle className="truncate tracking-tight">
              {sessionDisplayTitle(session.name, session.type)}
            </PopoverTitle>
          </div>
          {session.status === 'OPEN' ? (
            <div className="flex shrink-0 items-center gap-0.5">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Edit session"
                disabled={cancelSession.isPending}
                onClick={() => setIsEditing(true)}
              >
                <PencilIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs font-normal text-muted-foreground hover:text-destructive"
                disabled={cancelSession.isPending}
                onClick={() => {
                  void (async () => {
                    const confirmed = await confirmAction({
                      title: 'Cancel this session?',
                      description:
                        'This session will be locked. Attendance and details cannot be edited after cancel.',
                      confirmLabel: 'Cancel session',
                      cancelLabel: 'Keep open',
                      variant: 'destructive',
                    })
                    if (!confirmed) {
                      return
                    }
                    setError(null)
                    cancelSession.mutate({
                      path: { classroomId, sessionId: session.sessionId },
                    })
                  })()
                }}
              >
                {cancelSession.isPending ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                    Cancelling…
                  </>
                ) : (
                  'Cancel'
                )}
              </Button>
            </div>
          ) : null}
        </div>
        {session.description ? (
          <PopoverDescription className="line-clamp-2">
            {session.description}
          </PopoverDescription>
        ) : null}
      </PopoverHeader>

      <dl className="grid gap-1 border-t border-border/60 pt-2 text-xs">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Date</dt>
          <dd className="text-right font-medium">
            {formatSessionDate(session.sessionDate)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Time</dt>
          <dd className="text-right font-medium tabular-nums">
            {formatTime(session.startTime)}–{formatTime(session.endTime)}
          </dd>
        </div>
      </dl>

      {/* SCHEDULE recurrence summary needs scheduleId on ClassroomSessionResponse — not in core-openapi yet */}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="button" size="sm" className="w-full" onClick={onOpenSession}>
        Open session
      </Button>
    </div>
  )
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
  const [isSessionPopoverOpen, setIsSessionPopoverOpen] = useState(false)
  const [sessionSheet, setSessionSheet] =
    useState<SessionAttendanceTarget | null>(null)
  const [isSessionSheetOpen, setIsSessionSheetOpen] = useState(false)

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
    setIsSessionPopoverOpen(false)
  }

  function handleEventClick(info: EventClickInfo) {
    info.jsEvent.preventDefault()
    const {
      description,
      name,
      status,
      type,
      sessionDate,
      startTime,
      endTime,
    } = info.event.extendedProps
    setSessionPopover({
      sessionId: info.event.id,
      status:
        status === 'OPEN' || status === 'COMPLETED' || status === 'CANCELLED'
          ? status
          : 'COMPLETED',
      type: type === 'SCHEDULE' ? 'SCHEDULE' : 'ADHOC',
      name: typeof name === 'string' ? name : '',
      description: typeof description === 'string' ? description : '',
      sessionDate: typeof sessionDate === 'string' ? sessionDate : '',
      startTime: typeof startTime === 'string' ? startTime : '',
      endTime: typeof endTime === 'string' ? endTime : '',
      rect: info.el.getBoundingClientRect(),
    })
    setIsSessionPopoverOpen(true)
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
          eventClass={(info) => {
            const status = info.event.extendedProps.status
            if (status === 'CANCELLED') {
              return 'is-session-event is-cancelled-occurrence'
            }
            if (status === 'COMPLETED') {
              return 'is-session-event is-completed-occurrence'
            }
            return 'is-session-event'
          }}
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

      <Popover open={isSessionPopoverOpen} onOpenChange={setIsSessionPopoverOpen}>
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
        <PopoverContent side="right" align="start" className="w-80">
          {sessionPopover ? (
            <SessionPopoverPanel
              classroomId={classroomId}
              session={sessionPopover}
              onSessionChange={(next) => {
                setSessionPopover((current) =>
                  current ? { ...current, ...next } : current,
                )
              }}
              onOpenSession={() => {
                setSessionSheet({
                  sessionId: sessionPopover.sessionId,
                  status: sessionPopover.status,
                  type: sessionPopover.type,
                  name: sessionPopover.name,
                  description: sessionPopover.description,
                  sessionDate: sessionPopover.sessionDate,
                  startTime: sessionPopover.startTime,
                  endTime: sessionPopover.endTime,
                })
                setIsSessionPopoverOpen(false)
                setIsSessionSheetOpen(true)
              }}
            />
          ) : null}
        </PopoverContent>
      </Popover>

      <SessionAttendanceSheet
        open={isSessionSheetOpen}
        onOpenChange={setIsSessionSheetOpen}
        classroomId={classroomId}
        session={sessionSheet}
        onSessionChange={(next) => {
          setSessionSheet((current) =>
            current ? { ...current, ...next } : current,
          )
          setSessionPopover((current) =>
            current && sessionSheet && current.sessionId === sessionSheet.sessionId
              ? { ...current, ...next }
              : current,
          )
        }}
      />
    </div>
  )
}
