import type { RecurrenceByDay } from "@/generated/types.gen";
import { civilToLocalDate } from "./calendar-month";
import type { RecurrenceRow } from "./session-api";
import { clockHm } from "./session-time";

/** JS `Date#getDay` — Sunday=0 … Saturday=6. */
const BY_DAY_JS: Record<RecurrenceByDay, number> = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
};

const JS_TO_BY_DAY: RecurrenceByDay[] = [
  "SUNDAY",
  "MONDAY",
  "TUESDAY",
  "WEDNESDAY",
  "THURSDAY",
  "FRIDAY",
  "SATURDAY",
];

/** Weekday of a civil YYYY-MM-DD (date-only, no TZ shift). */
export function civilDateToByDay(civilDate: string): RecurrenceByDay {
  return JS_TO_BY_DAY[civilToLocalDate(civilDate).getDay()]!;
}

/** True when civil date is on the recurrence weekday and on/after series start. */
export function isRecurrenceOccurrence(
  civilDate: string,
  byDay: RecurrenceByDay,
  recurrenceStartDate: string,
): boolean {
  if (civilDate < recurrenceStartDate) return false;
  return civilToLocalDate(civilDate).getDay() === BY_DAY_JS[byDay];
}

/** Inclusive: civil date is on or after the truncate cutoff. */
export function isCutoffForward(civilDate: string, cutoffDate: string): boolean {
  return civilDate >= cutoffDate;
}

/** Recurrence day that would be cancelled (OPEN sessions on/after cutoff). */
export function isCancelledOccurrence(
  civilDate: string,
  byDay: RecurrenceByDay,
  recurrenceStartDate: string,
  cutoffDate: string,
): boolean {
  return (
    isRecurrenceOccurrence(civilDate, byDay, recurrenceStartDate) &&
    isCutoffForward(civilDate, cutoffDate)
  );
}

type SessionRecurrenceMatch = {
  sessionDate: string;
  startTime: string;
  endTime: string;
  name?: string;
};

/**
 * Resolve which recurrence generated a SCHEDULE session.
 * API sessions omit scheduleId — match weekday + clock (+ name when ambiguous).
 */
export function matchSessionRecurrence(
  session: SessionRecurrenceMatch,
  rows: RecurrenceRow[],
): RecurrenceRow | undefined {
  const byDay = civilDateToByDay(session.sessionDate);
  const start = clockHm(session.startTime);
  const end = clockHm(session.endTime);
  const matches = rows.filter((row) => {
    if (row.byDay !== byDay) return false;
    if (clockHm(row.startTime) !== start || clockHm(row.endTime) !== end) return false;
    if (session.sessionDate < row.recurrenceStartDate) return false;
    if (row.recurUntil && session.sessionDate > row.recurUntil) return false;
    return true;
  });
  if (matches.length === 0) return undefined;
  if (matches.length === 1) return matches[0];
  const named = session.name?.trim()
    ? matches.filter((row) => row.name === session.name)
    : [];
  return named.length === 1 ? named[0] : undefined;
}
