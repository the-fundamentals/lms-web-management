import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import FullCalendar from '@fullcalendar/react'
import type {
  CalendarRef,
  DateSelectInfo,
  DateSpanApi,
  DatesSetInfo,
  DayCellInfo,
  DayHeaderInfo,
  EventClickInfo,
  EventInput,
} from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/react/daygrid'
import interactionPlugin from '@fullcalendar/react/interaction'
import timeGridPlugin from '@fullcalendar/react/timegrid'
import themePlugin from '@fullcalendar/react/themes/monarch'
import type {
  ClassroomSessionResponse,
  ClassroomSessionStatus,
  ClassroomSessionType,
} from '@the-fundamentals/core-openapi'
import { updateClassroomSessionMutation, cancelClassroomSessionMutation } from '@the-fundamentals/core-openapi/react-query'
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
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
  PopoverTitle,
} from '@/components/ui/popover'
import {
  AddAdhocSessionDialog,
  AddAdhocSessionPopover,
} from '@/features/classrooms/components/add-adhoc-session-dialog'
import type { AdhocSessionDefaults } from '@/features/classrooms/components/add-adhoc-session-dialog'
import { RecurringSchedulesDialog } from '@/features/classrooms/components/recurring-schedules-dialog'
import { SessionAttendanceSheet } from '@/features/classrooms/components/session-attendance-sheet'
import type { SessionAttendanceTarget } from '@/features/classrooms/components/session-attendance-sheet'
import {
  getAllClassroomSessionsOptions,
  invalidateClassroomSessionsQueries,
} from '@/features/classrooms/classrooms-query'
import { cn } from '@/lib/utils'

import '@fullcalendar/react/skeleton.css'
import '@fullcalendar/react/themes/monarch/theme.css'

type ScheduleView = 'timeGridWeek' | 'dayGridMonth'

const calendarPlugins = [
  themePlugin,
  dayGridPlugin,
  timeGridPlugin,
  interactionPlugin,
]

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

function toTimeKey(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function toEventDateTime(sessionDate: string, time: string): string {
  const normalized = time.length === 5 ? `${time}:00` : time
  return `${sessionDate}T${normalized}`
}

const PENDING_ADHOC_EVENT_ID = '__pending-adhoc__'
const ONE_HOUR_MS = 60 * 60 * 1000

/** FullCalendar `end` is exclusive — same calendar day if last included ms shares start's Y/M/D. */
function isSingleDaySpan(start: Date, end: Date): boolean {
  const lastIncluded = new Date(Math.max(end.getTime() - 1, start.getTime()))
  return (
    start.getFullYear() === lastIncluded.getFullYear() &&
    start.getMonth() === lastIncluded.getMonth() &&
    start.getDate() === lastIncluded.getDate()
  )
}

function clampToSameDayEnd(start: Date, end: Date): Date {
  if (isSingleDaySpan(start, end)) {
    return end
  }
  const nextMidnight = new Date(start)
  nextMidnight.setHours(24, 0, 0, 0)
  return nextMidnight
}

function selectionToAdhocDefaults(info: DateSelectInfo): AdhocSessionDefaults {
  const start = info.start
  let end = clampToSameDayEnd(start, info.end)
  if (end.getTime() - start.getTime() < ONE_HOUR_MS) {
    end = new Date(start.getTime() + ONE_HOUR_MS)
    end = clampToSameDayEnd(start, end)
  }
  // Exclusive midnight → 23:59 so start/end stay on sessionDate (no multi-day event).
  const endTime =
    end.getHours() === 0 &&
    end.getMinutes() === 0 &&
    end.getSeconds() === 0 &&
    end.getMilliseconds() === 0 &&
    end.getTime() > start.getTime()
      ? '23:59'
      : toTimeKey(end)
  return {
    sessionDate: toDateKey(info.startStr),
    startTime: toTimeKey(start),
    endTime,
  }
}

function pendingAdhocEvent(defaults: AdhocSessionDefaults): EventInput {
  return {
    id: PENDING_ADHOC_EVENT_ID,
    title: 'New session',
    start: toEventDateTime(defaults.sessionDate, defaults.startTime),
    end: toEventDateTime(defaults.sessionDate, defaults.endTime),
    editable: false,
    startEditable: false,
    durationEditable: false,
    classNames: ['is-pending-adhoc'],
  }
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

/** Lower = earlier column / more space when events overlap. */
function sessionStatusRank(status: unknown): number {
  if (status === 'OPEN') {
    return 0
  }
  if (status === 'COMPLETED') {
    return 1
  }
  if (status === 'CANCELLED') {
    return 2
  }
  // Pending create / unknown — treat like OPEN so it stays visible.
  return 0
}

function compareOverlappingSessionEvents(
  a: { extendedProps?: Record<string, unknown> },
  b: { extendedProps?: Record<string, unknown> },
): number {
  return (
    sessionStatusRank(a.extendedProps?.status) -
    sessionStatusRank(b.extendedProps?.status)
  )
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

  const isBusy = updateSession.isPending || cancelSession.isPending

  async function handleCancelSession() {
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
  }

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
      <form onSubmit={handleSubmit} className="flex min-w-0 flex-col gap-3">
        <div className="flex min-w-0 flex-col gap-1 border-b border-border/60 pb-3">
          <Label htmlFor="session-edit-name" className="sr-only">
            Name
          </Label>
          <Input
            id="session-edit-name"
            autoFocus
            placeholder="Session title"
            className="h-9 border-0 bg-transparent px-0 text-base font-medium shadow-none focus-visible:ring-0"
            value={name}
            disabled={updateSession.isPending}
            onChange={(event) => {
              setError(null)
              setName(event.target.value)
            }}
          />
          <Label htmlFor="session-edit-description" className="sr-only">
            Description
          </Label>
          <Input
            id="session-edit-description"
            placeholder="Add description"
            className="h-8 border-0 bg-transparent px-0 text-sm text-muted-foreground shadow-none placeholder:text-muted-foreground/70 focus-visible:ring-0"
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

        <div className="flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={updateSession.isPending}
            onClick={() => {
              setIsEditing(false)
              setError(null)
              setName(session.name)
              setDescription(session.description)
            }}
          >
            Back
          </Button>
          <Button type="submit" size="sm" disabled={updateSession.isPending}>
            {updateSession.isPending ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </form>
    )
  }

  const title = sessionDisplayTitle(session.name, session.type)
  const descriptionText = session.description.trim()

  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex min-w-0 items-start gap-2 border-b border-border/60 pb-3">
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <SessionMetaBadge className={STATUS_BADGE_CLASS[session.status]}>
              {session.status}
            </SessionMetaBadge>
            <SessionMetaBadge className="bg-muted text-muted-foreground">
              {session.type === 'ADHOC' ? 'Adhoc' : 'Schedule'}
            </SessionMetaBadge>
          </div>
          <PopoverTitle className="text-base leading-snug tracking-tight">
            {title}
          </PopoverTitle>
          {descriptionText ? (
            <PopoverDescription className="line-clamp-3 text-sm leading-snug">
              {descriptionText}
            </PopoverDescription>
          ) : (
            <p className="text-sm text-muted-foreground/70">No description</p>
          )}
        </div>

        {session.status === 'OPEN' ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="shrink-0"
            aria-label="Edit session"
            disabled={isBusy}
            onClick={() => setIsEditing(true)}
          >
            <PencilIcon />
          </Button>
        ) : null}
      </div>

      <div className="flex min-w-0 flex-col gap-2.5 rounded-lg border border-border/70 bg-muted/40 p-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <CalendarDaysIcon
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Date</p>
            <p className="text-sm font-medium leading-snug">
              {formatSessionDate(session.sessionDate)}
            </p>
          </div>
        </div>
        <div className="flex min-w-0 items-start gap-2.5">
          <ClockIcon
            className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground">Time</p>
            <p className="text-sm font-medium tabular-nums leading-snug">
              {formatTime(session.startTime)}–{formatTime(session.endTime)}
            </p>
          </div>
        </div>
      </div>

      {/* SCHEDULE recurrence summary needs scheduleId on ClassroomSessionResponse — not in core-openapi yet */}

      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Button
          type="button"
          size="sm"
          className="w-full"
          disabled={isBusy}
          onClick={onOpenSession}
        >
          Open session
        </Button>
        {session.status === 'OPEN' ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive"
            disabled={isBusy}
            onClick={() => {
              void handleCancelSession()
            }}
          >
            {cancelSession.isPending ? (
              <>
                <Loader2Icon className="size-3.5 animate-spin" aria-hidden />
                Cancelling…
              </>
            ) : (
              'Cancel session'
            )}
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function ClassroomScheduleCalendar({
  classroomId,
}: {
  classroomId: string
}) {
  const calendarRef = useRef<CalendarRef>(null)
  const calendarRootRef = useRef<HTMLDivElement>(null)
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
  const [adhocDefaults, setAdhocDefaults] =
    useState<AdhocSessionDefaults | null>(null)
  const [isAdhocPopoverOpen, setIsAdhocPopoverOpen] = useState(false)
  const [adhocAnchorRect, setAdhocAnchorRect] = useState<DOMRect | null>(null)
  const [pendingAdhoc, setPendingAdhoc] = useState<EventInput | null>(null)

  // Same pointerdown that dismisses a popover can also start an FC select — suppress that gesture.
  const suppressSelectRef = useRef(false)
  const isAdhocPopoverOpenRef = useRef(false)
  const isSessionPopoverOpenRef = useRef(false)
  isAdhocPopoverOpenRef.current = isAdhocPopoverOpen
  isSessionPopoverOpenRef.current = isSessionPopoverOpen

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

  const events = useMemo(
    () => [
      ...sessions.map(sessionToEvent),
      ...(pendingAdhoc ? [pendingAdhoc] : []),
    ],
    [sessions, pendingAdhoc],
  )

  /** Clears ghost + selection. Keeps defaults/anchor so Popover doesn't jump to 0,0 while closing. */
  function clearPendingAdhoc(options?: { clearAnchor?: boolean }) {
    setPendingAdhoc(null)
    setIsAdhocPopoverOpen(false)
    calendarRef.current?.getApi().unselect()
    if (options?.clearAnchor) {
      setAdhocDefaults(null)
      setAdhocAnchorRect(null)
    }
  }

  const clearPendingAdhocRef = useRef(clearPendingAdhoc)
  clearPendingAdhocRef.current = clearPendingAdhoc

  function armSelectSuppress() {
    suppressSelectRef.current = true
  }

  // While a create/details popover is open, empty-grid clicks dismiss it and must not start a new select.
  useEffect(() => {
    if (!mounted) {
      return
    }
    const root = calendarRootRef.current
    if (!root) {
      return
    }

    function onPointerDownCapture(event: PointerEvent) {
      const adhocOpen = isAdhocPopoverOpenRef.current
      const sessionOpen = isSessionPopoverOpenRef.current
      if (!adhocOpen && !sessionOpen) {
        return
      }

      const target = event.target
      const onRealSession =
        target instanceof Element &&
        Boolean(target.closest('.fc-event')) &&
        !target.closest('.is-pending-adhoc')

      armSelectSuppress()

      if (adhocOpen) {
        clearPendingAdhocRef.current()
      }

      // Real session clicks: let eventClick through to switch details. Empty grid: block FC select.
      if (onRealSession) {
        return
      }

      if (sessionOpen) {
        setIsSessionPopoverOpen(false)
      }

      event.preventDefault()
      event.stopPropagation()
    }

    function onPointerUpCapture() {
      // Clear after FC's select handlers for this gesture have run.
      window.setTimeout(() => {
        suppressSelectRef.current = false
      }, 0)
    }

    root.addEventListener('pointerdown', onPointerDownCapture, true)
    window.addEventListener('pointerup', onPointerUpCapture, true)
    window.addEventListener('pointercancel', onPointerUpCapture, true)
    return () => {
      root.removeEventListener('pointerdown', onPointerDownCapture, true)
      window.removeEventListener('pointerup', onPointerUpCapture, true)
      window.removeEventListener('pointercancel', onPointerUpCapture, true)
    }
  }, [mounted])

  // Keep create popover pinned to the pending ghost while FC / page scrolls.
  useEffect(() => {
    if (!isAdhocPopoverOpen || !pendingAdhoc) {
      return
    }

    function syncAdhocAnchor() {
      const ghost = calendarRootRef.current?.querySelector('.is-pending-adhoc')
      if (!(ghost instanceof HTMLElement)) {
        return
      }
      const rect = ghost.getBoundingClientRect()
      setAdhocAnchorRect((current) => {
        if (
          current &&
          current.x === rect.x &&
          current.y === rect.y &&
          current.width === rect.width &&
          current.height === rect.height
        ) {
          return current
        }
        return new DOMRect(rect.x, rect.y, rect.width, rect.height)
      })
    }

    syncAdhocAnchor()
    // capture:true catches FullCalendar's internal `.fc-scroller` scrolls.
    window.addEventListener('scroll', syncAdhocAnchor, true)
    window.addEventListener('resize', syncAdhocAnchor)
    return () => {
      window.removeEventListener('scroll', syncAdhocAnchor, true)
      window.removeEventListener('resize', syncAdhocAnchor)
    }
  }, [isAdhocPopoverOpen, pendingAdhoc])

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

  function handleSelectAllow(span: DateSpanApi) {
    if (
      suppressSelectRef.current ||
      isAdhocPopoverOpenRef.current ||
      isSessionPopoverOpenRef.current
    ) {
      return false
    }
    return isSingleDaySpan(span.start, span.end)
  }

  function handleSelect(info: DateSelectInfo) {
    if (
      suppressSelectRef.current ||
      isAdhocPopoverOpenRef.current ||
      isSessionPopoverOpenRef.current
    ) {
      info.view.calendar.unselect()
      return
    }
    if (info.view.type !== 'timeGridWeek') {
      info.view.calendar.unselect()
      return
    }
    if (!isSingleDaySpan(info.start, info.end)) {
      info.view.calendar.unselect()
      return
    }

    // Capture mirror rect before React replaces it with the pending ghost.
    const mirror =
      calendarRootRef.current?.querySelector('.fc-highlight') ??
      calendarRootRef.current?.querySelector('.fc-event-mirror')
    const mirrorRect =
      mirror instanceof HTMLElement
        ? (() => {
            const r = mirror.getBoundingClientRect()
            return new DOMRect(r.x, r.y, r.width, r.height)
          })()
        : info.jsEvent
          ? new DOMRect(info.jsEvent.clientX, info.jsEvent.clientY, 1, 1)
          : null

    const defaults = selectionToAdhocDefaults(info)
    const pending = pendingAdhocEvent(defaults)
    setAdhocDefaults(defaults)
    setPendingAdhoc(pending)
    setAdhocAnchorRect(mirrorRect)
    setIsSessionPopoverOpen(false)
    setIsAdhocPopoverOpen(true)

    // Unselect after paint so mirror → ghost doesn't flash empty.
    window.requestAnimationFrame(() => {
      info.view.calendar.unselect()
    })
  }

  // Stable FC option identities — new fn props each render restart selection mid-drag (flicker).
  const selectAllowRef = useRef(handleSelectAllow)
  selectAllowRef.current = handleSelectAllow
  const selectRef = useRef(handleSelect)
  selectRef.current = handleSelect
  const onSelectAllow = useCallback(
    (span: DateSpanApi) => selectAllowRef.current(span),
    [],
  )
  const onSelect = useCallback((info: DateSelectInfo) => {
    selectRef.current(info)
  }, [])

  function handleEventClick(info: EventClickInfo) {
    info.jsEvent.preventDefault()
    if (info.event.id === PENDING_ADHOC_EVENT_ID) {
      return
    }
    // Switching sessions shouldn't leave a create draft open.
    clearPendingAdhoc()
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
    clearPendingAdhoc({ clearAnchor: true })
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
              clearPendingAdhoc({ clearAnchor: true })
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
              clearPendingAdhoc({ clearAnchor: true })
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
              clearPendingAdhoc({ clearAnchor: true })
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
              <DropdownMenuItem
                onSelect={() => {
                  clearPendingAdhoc({ clearAnchor: true })
                  setIsAddAdhocOpen(true)
                }}
              >
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
      <AddAdhocSessionPopover
        open={isAdhocPopoverOpen}
        onOpenChange={(open) => {
          if (!open) {
            // Keep anchorRect — clearing it mid-close remounts Popover at 0,0.
            clearPendingAdhoc()
            return
          }
          setIsAdhocPopoverOpen(true)
        }}
        classroomId={classroomId}
        defaults={adhocDefaults}
        anchorRect={adhocAnchorRect}
        onCreated={() => {
          clearPendingAdhoc()
        }}
      />
      <RecurringSchedulesDialog
        open={isRecurrencesOpen}
        onOpenChange={setIsRecurrencesOpen}
        classroomId={classroomId}
      />

      <div ref={calendarRootRef} className="rounded-xl border bg-card">
        <FullCalendar
          ref={calendarRef}
          plugins={calendarPlugins}
          initialView="timeGridWeek"
          headerToolbar={false}
          height="auto"
          events={events}
          // OPEN first (most space), then COMPLETED, CANCELLED last when overlapping.
          eventOrder={compareOverlappingSessionEvents}
          eventOrderStrict
          datesSet={handleDatesSet}
          selectable={
            view === 'timeGridWeek' &&
            !isAdhocPopoverOpen &&
            !isSessionPopoverOpen
          }
          selectMirror={
            view === 'timeGridWeek' &&
            !isAdhocPopoverOpen &&
            !isSessionPopoverOpen
          }
          selectMinDistance={0}
          selectAllow={onSelectAllow}
          select={onSelect}
          eventClick={handleEventClick}
          eventClass={(info) => {
            // selectMirror paints as a normal event (often muted) unless we tag it.
            if (info.isMirror || info.event.id === PENDING_ADHOC_EVENT_ID) {
              return 'is-pending-adhoc'
            }
            const status = info.event.extendedProps.status
            const type = info.event.extendedProps.type
            // TEMP: color-code ADHOC vs generated SCHEDULE — remove when product styling lands.
            const typeClass =
              type === 'ADHOC' ? 'is-adhoc-session' : 'is-schedule-session'
            if (status === 'CANCELLED') {
              return `is-session-event ${typeClass} is-cancelled-occurrence`
            }
            if (status === 'COMPLETED') {
              return `is-session-event ${typeClass} is-completed-occurrence`
            }
            return `is-session-event ${typeClass}`
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
        <PopoverContent side="right" align="start" className="w-80 p-3">
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
