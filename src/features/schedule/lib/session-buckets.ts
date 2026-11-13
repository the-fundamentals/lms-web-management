import type {
  ClassroomSessionStatus,
  ClassroomSessionType,
} from "@/generated/types.gen";
import { civilDateInGmt7 } from "@/shared/lib/gmt7";
import { sessionEndInstant, sessionStartInstant } from "./session-time";

export type SessionLike = {
  id: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  status: ClassroomSessionStatus;
  type?: ClassroomSessionType;
  name?: string;
};

export type SessionBucket = "upcoming" | "active" | "past";

export function compareSessionStart(a: SessionLike, b: SessionLike): number {
  const byStart =
    Date.parse(sessionStartInstant(a.sessionDate, a.startTime)) -
    Date.parse(sessionStartInstant(b.sessionDate, b.startTime));
  if (byStart !== 0) return byStart;
  return a.id.localeCompare(b.id);
}

export function classifySession(session: SessionLike, nowMs: number): SessionBucket {
  if (session.status === "COMPLETED" || session.status === "CANCELLED") return "past";
  const start = Date.parse(sessionStartInstant(session.sessionDate, session.startTime));
  const end = Date.parse(
    sessionEndInstant(session.sessionDate, session.startTime, session.endTime),
  );
  if (nowMs < start) return "upcoming";
  if (nowMs <= end) return "active";
  return "past";
}

/** YYYY-MM of a civil date (GMT+7 session date string). */
export function civilYearMonth(sessionDate: string): string {
  return sessionDate.slice(0, 7);
}

export function sessionTypeLabel(type: ClassroomSessionType | undefined): string {
  return type === "SCHEDULE" ? "Schedule" : "Adhoc";
}

export function sessionStatusLabel(status: ClassroomSessionStatus): string {
  if (status === "COMPLETED") return "Completed";
  if (status === "CANCELLED") return "Cancelled";
  return "Open";
}

/** Which session statuses are visible in Sessions calendar/list. */
export type SessionStatusFilter = Record<ClassroomSessionStatus, boolean>;

export const DEFAULT_SESSION_STATUS_FILTER: SessionStatusFilter = {
  OPEN: true,
  COMPLETED: true,
  CANCELLED: true,
};

export const SESSION_STATUS_FILTER_ORDER = [
  "OPEN",
  "COMPLETED",
  "CANCELLED",
] as const satisfies readonly ClassroomSessionStatus[];

export function filterSessionsByStatus<T extends { status: ClassroomSessionStatus }>(
  sessions: T[],
  filter: SessionStatusFilter,
): T[] {
  return sessions.filter((session) => filter[session.status]);
}

/**
 * Calendar chip surface — status reads first; type is a secondary tint for OPEN only.
 * Completed = settled wash; Cancelled = struck / destructive whisper.
 */
export function sessionChipClass(
  status: ClassroomSessionStatus,
  type: ClassroomSessionType | undefined,
): string {
  if (status === "CANCELLED") {
    return [
      "bg-destructive/10 text-destructive/90 line-through decoration-destructive/50",
      "hover:bg-destructive/15",
    ].join(" ");
  }
  if (status === "COMPLETED") {
    return [
      "bg-emerald-500/12 text-emerald-900 dark:text-emerald-100",
      "hover:bg-emerald-500/18",
    ].join(" ");
  }
  // OPEN — type still separates adhoc vs schedule
  if (type === "SCHEDULE") {
    return "bg-muted/70 text-foreground hover:bg-muted";
  }
  return "bg-primary/12 text-primary hover:bg-primary/18";
}

export function sessionStatusBadgeClass(status: ClassroomSessionStatus): string {
  if (status === "CANCELLED") {
    return "border-destructive/30 bg-destructive/10 text-destructive";
  }
  if (status === "COMPLETED") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-100";
  }
  return "border-primary/25 bg-primary/10 text-primary";
}

/**
 * FR4.1 — at most `limit` sessions, Active then Upcoming then Past.
 * Upcoming is limited to the current GMT+7 civil month.
 */
export function overviewBuckets(
  sessions: SessionLike[],
  nowMs: number,
  limit = 10,
): Record<SessionBucket, SessionLike[]> {
  const currentYm = civilYearMonth(civilDateInGmt7(new Date(nowMs)));
  const sorted = [...sessions].sort(compareSessionStart);
  const raw: Record<SessionBucket, SessionLike[]> = {
    upcoming: [],
    active: [],
    past: [],
  };
  for (const session of sorted) {
    const bucket = classifySession(session, nowMs);
    if (bucket === "upcoming" && civilYearMonth(session.sessionDate) !== currentYm) {
      continue;
    }
    raw[bucket].push(session);
  }
  let remaining = limit;
  const take = (list: SessionLike[]) => {
    const slice = list.slice(0, remaining);
    remaining -= slice.length;
    return slice;
  };
  return {
    active: take(raw.active),
    upcoming: take(raw.upcoming),
    past: take(raw.past),
  };
}
