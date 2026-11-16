import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  LayoutList,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";
import { RequestStatus } from "@/shared/ui/request-status";
import { SectionLoadingSkeleton } from "@/shared/ui/section-loading-skeleton";
import {
  filterSessionsByStatus,
  overviewBuckets,
  sessionTypeLabel,
  type SessionBucket,
  type SessionStatusFilter,
} from "../lib/session-buckets";
import {
  listRangeFromPrefs,
  readSessionOverviewPrefs,
  writeSessionOverviewPrefs,
  type ListGroupsOpen,
  type SessionOverviewView,
} from "../lib/session-overview-prefs";
import { sessionsQueryOptions, type SessionDateRange, type SessionRow } from "../lib/session-api";
import type { ListRangePreset } from "../lib/session-list-range";
import {
  formatSessionClockRange,
  sessionDateParts,
} from "../lib/session-time";
import { SessionCalendar } from "./session-calendar";
import { SessionComposeSheet } from "./session-compose-sheet";
import type { SessionCreateDefaults } from "./session-create";
import { SessionListRangeFilter } from "./session-list-range-filter";
import { SessionStatusFilterControl } from "./session-status-filter";

type SessionOverviewProps = {
  classroomId: string;
};

const LABELS: Record<SessionBucket, string> = {
  active: "Active",
  upcoming: "Upcoming",
  past: "Past",
};

function SessionGroup({
  classroomId,
  bucket,
  title,
  sessions,
  open,
  onOpenChange,
}: {
  classroomId: string;
  bucket: SessionBucket;
  title: string;
  sessions: SessionRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (sessions.length === 0) return null;
  return (
    <section className="flex flex-col gap-2" data-testid={`session-group-${bucket}`}>
      <button
        aria-expanded={open}
        className={cn(
          "flex w-full items-center gap-2 border-b border-border pb-2",
          "type-secondary text-muted-foreground transition-colors hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        )}
        data-testid={`session-group-toggle-${bucket}`}
        onClick={() => onOpenChange(!open)}
        type="button"
      >
        <ChevronDown
          aria-hidden
          className={cn("size-4 shrink-0 transition-transform", !open && "-rotate-90")}
        />
        <span className="font-medium text-foreground">{title}</span>
        <span className="tabular-nums">{sessions.length}</span>
      </button>
      {open ? (
        <ul className="flex flex-col gap-1.5">
          {sessions.map((session) => {
            const date = sessionDateParts(session.sessionDate);
            const scheduled = session.type === "SCHEDULE";
            // No name → type only; avoid redundant "Session · Schedule"
            const titleText = session.name?.trim() || "";
            const clock = formatSessionClockRange(
              session.sessionDate,
              session.startTime,
              session.endTime,
            );
            return (
              <li key={session.id}>
                <Link
                  className={cn(
                    "group relative flex items-center gap-3 overflow-hidden rounded-xl border border-border/80",
                    "bg-background px-3 py-2.5 pl-3.5 shadow-sm sm:gap-3.5 sm:px-3.5 sm:pl-4",
                    "transition-colors hover:bg-muted/40",
                    "focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none",
                  )}
                  data-testid={`session-row-${session.id}`}
                  params={{ classroomId, sessionId: session.id }}
                  to="/classrooms/$classroomId/sessions/$sessionId"
                >
                  {/* Type rail — Adhoc = primary, Schedule = muted */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-y-2.5 left-0 w-1 rounded-r-full",
                      scheduled ? "bg-muted-foreground/35" : "bg-primary",
                    )}
                  />
                  <span
                    aria-hidden
                    className={cn(
                      "flex size-10 shrink-0 flex-col items-center justify-center rounded-lg",
                      scheduled
                        ? "bg-muted text-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <span className="type-section leading-none tabular-nums">{date.day}</span>
                    <span className="type-secondary leading-none text-muted-foreground">
                      {date.month}
                    </span>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="type-body shrink-0 font-medium tabular-nums text-foreground">
                        {clock}
                      </span>
                      {titleText ? (
                        <span className="min-w-0 truncate type-body text-foreground/75">
                          {titleText}
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="type-secondary text-muted-foreground">
                        {date.weekday}, {date.day} {date.month}
                      </span>
                      <span className="text-muted-foreground/40" aria-hidden>
                        ·
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 type-secondary font-medium",
                          scheduled ? "text-muted-foreground" : "text-primary",
                        )}
                        data-testid={`session-type-${session.id}`}
                      >
                        {scheduled ? (
                          <RefreshCw aria-hidden className="size-3 shrink-0" />
                        ) : (
                          <Plus aria-hidden className="size-3 shrink-0" />
                        )}
                        {sessionTypeLabel(session.type)}
                      </span>
                      {session.status !== "OPEN" ? (
                        <Badge className="capitalize" variant="outline">
                          {session.status.toLowerCase()}
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-4 shrink-0 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}

function SessionListView({
  classroomId,
  onNew,
  statusFilter,
  listPreset,
  listRange,
  onListRangeChange,
  listGroupsOpen,
  onListGroupsOpenChange,
}: {
  classroomId: string;
  onNew: () => void;
  statusFilter: SessionStatusFilter;
  listPreset: ListRangePreset;
  listRange: SessionDateRange;
  onListRangeChange: (preset: ListRangePreset, range: SessionDateRange) => void;
  listGroupsOpen: ListGroupsOpen;
  onListGroupsOpenChange: (next: ListGroupsOpen) => void;
}) {
  const query = useQuery({
    ...sessionsQueryOptions(classroomId, listRange),
    placeholderData: keepPreviousData,
  });
  const filtered = filterSessionsByStatus(query.data ?? [], statusFilter);
  const buckets = overviewBuckets(filtered, Date.now());
  const total =
    buckets.active.length + buckets.upcoming.length + buckets.past.length;

  return (
    <div className="flex flex-col gap-4">
      <SessionListRangeFilter
        onPresetChange={onListRangeChange}
        preset={listPreset}
        range={listRange}
      />
      <RequestStatus
        error={query.error}
        onRetry={() => {
          void query.refetch();
        }}
        pending={<SectionLoadingSkeleton rows={5} />}
        status={
          query.isPending && !query.isPlaceholderData
            ? "pending"
            : query.isError
              ? "error"
              : "success"
        }
        title="Couldn't load sessions"
      >
        {total === 0 ? (
          <div
            className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-border bg-muted/20 p-6"
            data-testid="session-overview-empty"
          >
            <div className="flex flex-col gap-1">
              <p className="type-body text-foreground">No sessions in this range</p>
              <p className="type-secondary text-muted-foreground">
                Add a one-off session or a weekly recurrence.
              </p>
            </div>
            <Button
              data-testid="new-session-empty"
              onClick={onNew}
              size="sm"
              type="button"
            >
              <Plus aria-hidden />
              New session
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-6" data-testid="session-list-view">
            {(["active", "upcoming", "past"] as const).map((key) => (
              <SessionGroup
                bucket={key}
                classroomId={classroomId}
                key={key}
                onOpenChange={(open) =>
                  onListGroupsOpenChange({ ...listGroupsOpen, [key]: open })
                }
                open={listGroupsOpen[key]}
                sessions={buckets[key] as SessionRow[]}
                title={LABELS[key]}
              />
            ))}
          </div>
        )}
      </RequestStatus>
    </div>
  );
}

export function SessionOverview({ classroomId }: SessionOverviewProps) {
  const [view, setView] = useState<SessionOverviewView>(
    () => readSessionOverviewPrefs(classroomId).view,
  );
  const [statusFilter, setStatusFilter] = useState<SessionStatusFilter>(
    () => readSessionOverviewPrefs(classroomId).statusFilter,
  );
  const [listPreset, setListPreset] = useState<ListRangePreset>(
    () => readSessionOverviewPrefs(classroomId).listPreset,
  );
  const [listRange, setListRange] = useState<SessionDateRange>(() =>
    listRangeFromPrefs(readSessionOverviewPrefs(classroomId)),
  );
  const [listGroupsOpen, setListGroupsOpen] = useState<ListGroupsOpen>(
    () => readSessionOverviewPrefs(classroomId).listGroupsOpen,
  );
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeDefaults, setComposeDefaults] = useState<SessionCreateDefaults | undefined>();

  // Re-hydrate when switching classrooms (same component instance).
  useEffect(() => {
    const prefs = readSessionOverviewPrefs(classroomId);
    setView(prefs.view);
    setStatusFilter(prefs.statusFilter);
    setListPreset(prefs.listPreset);
    setListRange(listRangeFromPrefs(prefs));
    setListGroupsOpen(prefs.listGroupsOpen);
  }, [classroomId]);

  useEffect(() => {
    writeSessionOverviewPrefs(classroomId, {
      view,
      statusFilter,
      listPreset,
      listRange,
      listGroupsOpen,
    });
  }, [classroomId, view, statusFilter, listPreset, listRange, listGroupsOpen]);

  function openCompose(defaults?: SessionCreateDefaults) {
    setComposeDefaults(defaults);
    setComposeOpen(true);
  }

  return (
    <div className="flex flex-col gap-5" data-testid="session-overview">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-section text-foreground">Sessions</p>
          <p className="type-secondary text-muted-foreground">
            {view === "list"
              ? "Filtered list · times in GMT+7"
              : "Month grid · up to 3 months ahead · GMT+7"}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div
            aria-label="Sessions view"
            className="inline-flex h-8 items-center gap-0.5 rounded-lg border border-border bg-background p-0.5"
            data-testid="sessions-view-selector"
            role="group"
          >
            <Button
              aria-pressed={view === "calendar"}
              className={cn("h-7 px-2.5", view === "calendar" && "bg-muted")}
              data-testid="sessions-view-calendar"
              onClick={() => setView("calendar")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <CalendarDays aria-hidden />
              Calendar
            </Button>
            <Button
              aria-pressed={view === "list"}
              className={cn("h-7 px-2.5", view === "list" && "bg-muted")}
              data-testid="sessions-view-list"
              onClick={() => setView("list")}
              size="sm"
              type="button"
              variant="ghost"
            >
              <LayoutList aria-hidden />
              List
            </Button>
          </div>
          <SessionStatusFilterControl onChange={setStatusFilter} value={statusFilter} />
          <Button
            data-testid="new-session"
            onClick={() => openCompose()}
            size="sm"
            type="button"
          >
            <Plus aria-hidden />
            New
          </Button>
        </div>
      </div>

      {view === "calendar" ? (
        <SessionCalendar
          classroomId={classroomId}
          embedded
          onAddDay={(date, times) =>
            openCompose({
              sessionDate: date,
              startTime: times?.startTime ?? "09:00",
              endTime: times?.endTime ?? "10:00",
            })
          }
          statusFilter={statusFilter}
        />
      ) : (
        <SessionListView
          classroomId={classroomId}
          listGroupsOpen={listGroupsOpen}
          listPreset={listPreset}
          listRange={listRange}
          onListGroupsOpenChange={setListGroupsOpen}
          onListRangeChange={(preset, range) => {
            setListPreset(preset);
            setListRange(range);
          }}
          onNew={() => openCompose()}
          statusFilter={statusFilter}
        />
      )}

      <SessionComposeSheet
        classroomId={classroomId}
        defaults={composeDefaults}
        onOpenChange={(open) => {
          setComposeOpen(open);
          if (!open) setComposeDefaults(undefined);
        }}
        open={composeOpen}
      />
    </div>
  );
}
