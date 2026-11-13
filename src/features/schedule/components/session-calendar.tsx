import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft, ChevronRight, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";
import { RequestStatus } from "@/shared/ui/request-status";
import {
  buildMonthGrid,
  canShiftYearMonth,
  civilMonthRange,
  gmt7YearMonth,
  monthLabel,
  shiftYearMonth,
} from "../lib/calendar-month";
import {
  DEFAULT_SESSION_STATUS_FILTER,
  filterSessionsByStatus,
  type SessionStatusFilter,
} from "../lib/session-buckets";
import { sessionsQueryOptions } from "../lib/session-api";
import { clockHm, nowCivilInGmt7 } from "../lib/session-time";
import { SessionDaySheet } from "./session-day-sheet";
import { SessionPeekPopover } from "./session-peek-popover";

type SessionCalendarProps = {
  classroomId: string;
  /** When true, omit page chrome — used as the Sessions Calendar view. */
  embedded?: boolean;
  /** Opens compose with this civil date (and optional clock range) prefilled. */
  onAddDay?: (
    date: string,
    times?: { startTime: string; endTime: string },
  ) => void;
  /** Status visibility — defaults to all on. */
  statusFilter?: SessionStatusFilter;
};

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const MAX_VISIBLE_SESSIONS = 3;

export function SessionCalendar({
  classroomId,
  embedded = false,
  onAddDay,
  statusFilter = DEFAULT_SESSION_STATUS_FILTER,
}: SessionCalendarProps) {
  const initial = gmt7YearMonth();
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [dayOpen, setDayOpen] = useState(false);
  const [dayDate, setDayDate] = useState<string | null>(null);
  const today = nowCivilInGmt7().date;
  const monthRange = useMemo(() => civilMonthRange(year, month), [year, month]);
  const query = useQuery({
    ...sessionsQueryOptions(classroomId, monthRange),
    // Keep month chrome mounted while the ranged query refetches.
    placeholderData: keepPreviousData,
  });
  const filteredSessions = useMemo(
    () => filterSessionsByStatus(query.data ?? [], statusFilter),
    [query.data, statusFilter],
  );
  const cells = useMemo(
    () => buildMonthGrid(year, month, filteredSessions),
    [year, month, filteredSessions],
  );

  function openDay(date: string) {
    setDayDate(date);
    setDayOpen(true);
  }

  function shift(delta: number) {
    if (!canShiftYearMonth(year, month, delta)) return;
    const next = shiftYearMonth(year, month, delta);
    setYear(next.year);
    setMonth(next.month);
  }

  const canGoNext = canShiftYearMonth(year, month, 1);

  const monthNav = (
    <div className="flex items-center justify-between gap-2">
      <Button
        data-testid="calendar-prev"
        onClick={() => shift(-1)}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <ChevronLeft aria-hidden />
        <span className="sr-only">Previous month</span>
      </Button>
      <p className="type-body font-medium text-foreground" data-testid="calendar-month-label">
        {monthLabel(year, month)}
      </p>
      <Button
        data-testid="calendar-next"
        disabled={!canGoNext}
        onClick={() => shift(1)}
        size="icon-sm"
        type="button"
        variant="outline"
      >
        <ChevronRight aria-hidden />
        <span className="sr-only">Next month</span>
      </Button>
    </div>
  );

  const grid = (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-7 gap-2 text-center type-secondary text-muted-foreground">
        {WEEKDAYS.map((d) => (
          <div className="px-1 py-1" key={d}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2" data-testid="calendar-grid">
        {cells.map((cell) => {
          const isToday = cell.date === today;
          const visible = cell.sessions.slice(0, MAX_VISIBLE_SESSIONS);
          const overflow = cell.sessions.length - visible.length;
          return (
            <div
              className={cn(
                "group/cell relative flex min-h-28 flex-col gap-2 rounded-xl border p-2.5 text-left sm:min-h-32",
                cell.inMonth
                  ? "border-border/80 bg-background"
                  : "border-transparent bg-muted/20 text-muted-foreground",
                isToday && cell.inMonth && "border-primary/50 bg-primary/5",
              )}
              data-testid={`calendar-cell-${cell.date}`}
              key={cell.date}
            >
              <div className="flex items-start justify-between gap-1">
                <button
                  aria-label={`Open day view for ${cell.date}`}
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full type-secondary tabular-nums",
                    "transition-colors hover:ring-2 hover:ring-ring/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    isToday && cell.inMonth
                      ? "bg-primary font-medium text-primary-foreground"
                      : cell.inMonth
                        ? "font-medium text-foreground hover:bg-muted"
                        : "text-muted-foreground hover:bg-muted/60",
                  )}
                  data-testid={`calendar-day-${cell.date}`}
                  onClick={() => openDay(cell.date)}
                  type="button"
                >
                  {Number(cell.date.slice(-2))}
                </button>
                {onAddDay ? (
                  <Button
                    aria-label={`Add session on ${cell.date}`}
                    className={cn(
                      "size-7 shrink-0 rounded-md",
                      "opacity-0 transition-opacity",
                      "group-hover/cell:opacity-100 group-focus-within/cell:opacity-100",
                      "focus-visible:opacity-100",
                    )}
                    data-testid={`calendar-add-${cell.date}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      onAddDay(cell.date);
                    }}
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <Plus aria-hidden className="size-3.5" />
                  </Button>
                ) : null}
              </div>
              {visible.length > 0 ? (
                <ul className="flex min-h-0 flex-1 flex-col gap-1.5">
                  {visible.map((session) => {
                    const scheduled = session.type === "SCHEDULE";
                    const isOpen = session.status === "OPEN";
                    return (
                      <li key={session.id}>
                        <SessionPeekPopover classroomId={classroomId} session={session}>
                          {/* Type icon only while OPEN — completed/cancelled use status glyph alone. */}
                          {isOpen ? (
                            scheduled ? (
                              <RefreshCw aria-hidden className="size-3 shrink-0 opacity-70" />
                            ) : (
                              <Plus aria-hidden className="size-3 shrink-0 opacity-70" />
                            )
                          ) : null}
                          <span className="tabular-nums">{clockHm(session.startTime)}</span>
                        </SessionPeekPopover>
                      </li>
                    );
                  })}
                  {overflow > 0 ? (
                    <li className="type-secondary px-1 text-muted-foreground">+{overflow} more</li>
                  ) : null}
                </ul>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );

  const queryStatus =
    query.isPending && !query.isPlaceholderData
      ? "pending"
      : query.isError
        ? "error"
        : "success";

  const daySheet = (
    <SessionDaySheet
      classroomId={classroomId}
      date={dayDate}
      onAdd={
        onAddDay
          ? (date, times) => {
              setDayOpen(false);
              onAddDay(date, times);
            }
          : undefined
      }
      onOpenChange={setDayOpen}
      open={dayOpen}
      sessions={filteredSessions}
    />
  );

  if (embedded) {
    return (
      <div className="flex flex-col gap-4" data-testid="session-calendar">
        {monthNav}
        <RequestStatus
          error={query.error}
          onRetry={() => {
            void query.refetch();
          }}
          status={queryStatus}
        >
          {grid}
        </RequestStatus>
        {daySheet}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4" data-testid="session-calendar">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-section text-foreground">Calendar</p>
          <p className="type-secondary text-muted-foreground">
            Month in GMT+7 · sessions on their start date.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link
            data-testid="calendar-back"
            params={{ classroomId }}
            to="/classrooms/$classroomId/sessions"
          >
            <ArrowLeft aria-hidden />
            Back to sessions
          </Link>
        </Button>
      </div>

      {monthNav}
      <RequestStatus
        error={query.error}
        onRetry={() => {
          void query.refetch();
        }}
        status={queryStatus}
      >
        {grid}
      </RequestStatus>
      {daySheet}
    </div>
  );
}
