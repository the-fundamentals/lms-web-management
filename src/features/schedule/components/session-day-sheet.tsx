import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { CalendarDays, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/shared/lib/cn";
import { sessionTypeLabel } from "../lib/session-buckets";
import type { SessionRow } from "../lib/session-api";
import {
  clockHm,
  formatSessionClockRange,
  minutesOfDay,
  nowCivilInGmt7,
  sessionDateParts,
  sessionEndCivilDate,
} from "../lib/session-time";

const HOUR_PX = 56;
const DAY_MINUTES = 24 * 60;
const DAY_HEIGHT = HOUR_PX * 24;
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DEFAULT_SCROLL_HOUR = 8;

type DayAddTimes = { startTime: string; endTime: string };

type SessionDaySheetProps = {
  classroomId: string;
  date: string | null;
  sessions: SessionRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd?: (date: string, times?: DayAddTimes) => void;
};

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00`;
}

function nextHourLabel(hour: number): string {
  return hourLabel((hour + 1) % 24);
}

function dayLayout(session: SessionRow, day: string): { top: number; height: number } | null {
  if (session.sessionDate !== day) return null;
  const start = minutesOfDay(session.startTime);
  const endCivil = sessionEndCivilDate(session.sessionDate, session.startTime, session.endTime);
  const end = endCivil === day ? minutesOfDay(session.endTime) : DAY_MINUTES;
  const span = Math.max(end - start, 30);
  return {
    top: (start / DAY_MINUTES) * DAY_HEIGHT,
    height: (span / DAY_MINUTES) * DAY_HEIGHT,
  };
}

export function SessionDaySheet({
  classroomId,
  date,
  sessions,
  open,
  onOpenChange,
  onAdd,
}: SessionDaySheetProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const now = nowCivilInGmt7();
  const isToday = Boolean(date && date === now.date);
  const nowMinutes = isToday ? minutesOfDay(`${now.clock}:00`) : null;
  const daySessions = date
    ? sessions
        .filter((s) => s.sessionDate === date)
        .slice()
        .sort(
          (a, b) =>
            minutesOfDay(a.startTime) - minutesOfDay(b.startTime) || a.id.localeCompare(b.id),
        )
    : [];

  const scrollAnchor = daySessions[0]?.startTime ?? (isToday ? now.clock : "");

  useEffect(() => {
    if (!open || !date || !scrollRef.current) return;
    const hour = scrollAnchor
      ? Math.floor(minutesOfDay(scrollAnchor) / 60)
      : DEFAULT_SCROLL_HOUR;
    scrollRef.current.scrollTop = Math.max(0, hour * HOUR_PX - HOUR_PX);
  }, [open, date, scrollAnchor]);

  if (!date) return null;

  const parts = sessionDateParts(date);

  function addAt(hour: number) {
    onAdd?.(date, { startTime: hourLabel(hour), endTime: nextHourLabel(hour) });
  }

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent
        className="flex w-full flex-col gap-0 p-0 sm:max-w-md"
        data-testid="session-day-sheet"
        side="right"
      >
        <SheetHeader className="border-b border-border/80 bg-muted/20 px-5 py-5 pr-12">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <CalendarDays aria-hidden className="size-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-1">
              <SheetTitle className="type-section">{parts.label}</SheetTitle>
              <SheetDescription>
                {daySessions.length === 0
                  ? "No sessions yet · times in GMT+7"
                  : `${daySessions.length} session${daySessions.length === 1 ? "" : "s"} · GMT+7`}
              </SheetDescription>
            </div>
            {onAdd ? (
              <Button
                className="shrink-0"
                data-testid="day-sheet-add"
                onClick={() => addAt(DEFAULT_SCROLL_HOUR)}
                size="sm"
                type="button"
              >
                <Plus aria-hidden />
                Add
              </Button>
            ) : null}
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" ref={scrollRef}>
          {daySessions.length === 0 ? (
            <div
              className="mb-4 rounded-2xl border border-dashed border-border bg-muted/30 px-4 py-5"
              data-testid="day-sheet-empty"
            >
              <p className="type-body font-medium text-foreground">Free day</p>
              <p className="mt-1 type-secondary text-muted-foreground">
                Click an hour below to schedule, or use Add.
              </p>
            </div>
          ) : null}

          <div
            className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
            data-testid="day-sheet-timeline"
            style={{ height: DAY_HEIGHT }}
          >
            {HOURS.map((hour) => (
              <div
                className="group/hour absolute inset-x-0 flex border-t border-border/50 first:border-t-0"
                key={hour}
                style={{ top: hour * HOUR_PX, height: HOUR_PX }}
              >
                <span className="w-14 shrink-0 pt-2 pl-3 type-secondary tabular-nums text-muted-foreground">
                  {hourLabel(hour)}
                </span>
                {onAdd ? (
                  <button
                    aria-label={`Add session at ${hourLabel(hour)}`}
                    className={cn(
                      "relative mr-2 ml-1 min-w-0 flex-1 rounded-lg",
                      "transition-colors hover:bg-primary/5",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    )}
                    data-testid={`day-sheet-slot-${hour}`}
                    onClick={() => addAt(hour)}
                    type="button"
                  >
                    <span
                      className={cn(
                        "pointer-events-none absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1",
                        "rounded-md bg-background/90 px-1.5 py-0.5 type-secondary text-muted-foreground shadow-sm",
                        "opacity-0 transition-opacity group-hover/hour:opacity-100 group-focus-within/hour:opacity-100",
                      )}
                    >
                      <Plus aria-hidden className="size-3" />
                      Add
                    </span>
                  </button>
                ) : (
                  <span className="min-w-0 flex-1" />
                )}
              </div>
            ))}

            {nowMinutes !== null ? (
              <div
                aria-hidden
                className="pointer-events-none absolute right-2 left-14 z-20 flex items-center"
                data-testid="day-sheet-now"
                style={{ top: (nowMinutes / DAY_MINUTES) * DAY_HEIGHT }}
              >
                <span className="size-2 shrink-0 rounded-full bg-destructive" />
                <span className="h-px flex-1 bg-destructive/80" />
              </div>
            ) : null}

            {daySessions.map((session) => {
              const layout = dayLayout(session, date);
              if (!layout) return null;
              const scheduled = session.type === "SCHEDULE";
              const label = sessionTypeLabel(session.type);
              const name = session.name?.trim();
              const range = formatSessionClockRange(
                session.sessionDate,
                session.startTime,
                session.endTime,
              );
              return (
                <Link
                  className={cn(
                    "absolute right-3 left-14 z-10 overflow-hidden rounded-xl border px-2.5 py-1.5",
                    "type-secondary leading-tight shadow-sm",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    scheduled
                      ? "border-border bg-muted/90 text-foreground hover:bg-muted"
                      : "border-primary/30 bg-primary/15 text-primary hover:bg-primary/20",
                  )}
                  data-testid={`day-sheet-session-${session.id}`}
                  key={session.id}
                  params={{ classroomId, sessionId: session.id }}
                  style={{ top: layout.top + 4, height: Math.max(layout.height - 8, 32) }}
                  title={`${range} · ${label}${name ? ` · ${name}` : ""}`}
                  to="/classrooms/$classroomId/sessions/$sessionId"
                >
                  <span className="flex min-w-0 items-start gap-1.5">
                    {scheduled ? (
                      <RefreshCw aria-hidden className="mt-0.5 size-3 shrink-0 opacity-70" />
                    ) : (
                      <Plus aria-hidden className="mt-0.5 size-3 shrink-0 opacity-70" />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-medium tabular-nums">
                        {clockHm(session.startTime)}
                        {name ? ` · ${name}` : ` · ${label}`}
                      </span>
                      {layout.height > 44 ? (
                        <span className="mt-0.5 block truncate opacity-80">{range}</span>
                      ) : null}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
