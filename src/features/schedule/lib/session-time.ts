import { civilDateInGmt7, instantFromGmt7 } from "@/shared/lib/gmt7";

/** Normalize OpenAPI time-local (`HH:MM:SS` or `HH:MM`) to `HH:MM`. */
export function clockHm(time: string): string {
  const match = /^(\d{2}):(\d{2})(?::\d{2})?$/.exec(time.trim());
  if (!match) throw new Error("Expected a clock time");
  return `${match[1]}:${match[2]}`;
}

/** Minutes from 00:00 for a clock time (0–1439). */
export function minutesOfDay(time: string): number {
  const hm = clockHm(time);
  const hours = Number(hm.slice(0, 2));
  const minutes = Number(hm.slice(3, 5));
  return hours * 60 + minutes;
}

function addCivilDays(civilDate: string, days: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) throw new Error("Expected a calendar date");
  const utc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + days);
  const d = new Date(utc);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** End civil date — next day when end clock is ≤ start (midnight cross). */
export function sessionEndCivilDate(sessionDate: string, startTime: string, endTime: string): string {
  const start = clockHm(startTime);
  const end = clockHm(endTime);
  return end <= start ? addCivilDays(sessionDate, 1) : sessionDate;
}

export function sessionStartInstant(sessionDate: string, startTime: string): string {
  return instantFromGmt7(sessionDate, clockHm(startTime));
}

export function sessionEndInstant(sessionDate: string, startTime: string, endTime: string): string {
  return instantFromGmt7(
    sessionEndCivilDate(sessionDate, startTime, endTime),
    clockHm(endTime),
  );
}

export function nowCivilInGmt7(now: Date = new Date()): {
  date: string;
  clock: string;
  ms: number;
} {
  const date = civilDateInGmt7(now);
  const shifted = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const clock = `${String(shifted.getUTCHours()).padStart(2, "0")}:${String(shifted.getUTCMinutes()).padStart(2, "0")}`;
  return { date, clock, ms: now.getTime() };
}

/** Label like `2026-07-19 09:00 – 10:00 GMT+7` or end with next date when needed. */
export function formatSessionWhen(
  sessionDate: string,
  startTime: string,
  endTime: string,
): string {
  const start = clockHm(startTime);
  const end = clockHm(endTime);
  const endDate = sessionEndCivilDate(sessionDate, startTime, endTime);
  const endLabel = endDate === sessionDate ? end : `${endDate} ${end}`;
  return `${sessionDate} ${start} – ${endLabel} GMT+7`;
}

const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/** Parts for list-row date tiles — civil GMT+7 date only (no TZ shift). */
export function sessionDateParts(sessionDate: string): {
  day: string;
  weekday: string;
  month: string;
  label: string;
} {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(sessionDate);
  if (!match) throw new Error("Expected a calendar date");
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const weekday = WEEKDAY_SHORT[utc.getUTCDay()]!;
  const month = MONTH_SHORT[m - 1]!;
  const day = String(d);
  return {
    day,
    weekday,
    month,
    label: `${weekday}, ${day} ${month}`,
  };
}

/** Clock span for list rows; notes next-date end when midnight-cross. */
export function formatSessionClockRange(
  sessionDate: string,
  startTime: string,
  endTime: string,
): string {
  const start = clockHm(startTime);
  const end = clockHm(endTime);
  const endDate = sessionEndCivilDate(sessionDate, startTime, endTime);
  if (endDate === sessionDate) return `${start} – ${end}`;
  return `${start} – ${end} (+1 day)`;
}
