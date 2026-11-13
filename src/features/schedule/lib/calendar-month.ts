import { civilDateInGmt7 } from "@/shared/lib/gmt7";
import type { SessionLike } from "./session-buckets";

export type CalendarCell = {
  date: string;
  inMonth: boolean;
  sessions: SessionLike[];
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function gmt7YearMonth(now: Date = new Date()): { year: number; month: number } {
  const date = civilDateInGmt7(now);
  const [y, m] = date.split("-").map(Number);
  return { year: y!, month: m! };
}

export function shiftYearMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const idx = year * 12 + (month - 1) + delta;
  return { year: Math.floor(idx / 12), month: (idx % 12) + 1 };
}

/** Month grid Mon–Sun in GMT+7 civil dates; sessions keyed by start civil date. */
export function buildMonthGrid(
  year: number,
  month: number,
  sessions: SessionLike[],
): CalendarCell[] {
  const byDate = new Map<string, SessionLike[]>();
  for (const session of sessions) {
    const list = byDate.get(session.sessionDate) ?? [];
    list.push(session);
    byDate.set(session.sessionDate, list);
  }

  const first = new Date(Date.UTC(year, month - 1, 1));
  // JS getUTCDay: 0=Sun … convert to Mon=0
  const startPad = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startPad; i++) {
    const d = new Date(Date.UTC(year, month - 1, 1 - (startPad - i)));
    const date = `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
    cells.push({ date, inMonth: false, sessions: byDate.get(date) ?? [] });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const date = `${year}-${pad(month)}-${pad(day)}`;
    cells.push({ date, inMonth: true, sessions: byDate.get(date) ?? [] });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!;
    const [y, m, d] = last.date.split("-").map(Number);
    const next = new Date(Date.UTC(y!, m! - 1, d! + 1));
    const date = `${next.getUTCFullYear()}-${pad(next.getUTCMonth() + 1)}-${pad(next.getUTCDate())}`;
    cells.push({ date, inMonth: false, sessions: byDate.get(date) ?? [] });
  }
  return cells;
}

export function monthLabel(year: number, month: number): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, month - 1, 1)));
}

/** Inclusive civil YYYY-MM-DD bounds for a calendar month (UTC date math). */
export function civilMonthRange(
  year: number,
  month: number,
): { from: string; to: string } {
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  return {
    from: `${year}-${pad(month)}-01`,
    to: `${year}-${pad(month)}-${pad(daysInMonth)}`,
  };
}

/**
 * Inclusive Mon–Sun civil week containing `civilDate` (YYYY-MM-DD).
 * Week starts Monday to match the calendar grid.
 */
export function civilWeekRangeContaining(civilDate: string): { from: string; to: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) throw new Error("Expected a calendar date");
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const mondayOffset = (utc.getUTCDay() + 6) % 7;
  const monday = new Date(Date.UTC(y, m - 1, d - mondayOffset));
  const sunday = new Date(Date.UTC(y, m - 1, d - mondayOffset + 6));
  const fmt = (value: Date) =>
    `${value.getUTCFullYear()}-${pad(value.getUTCMonth() + 1)}-${pad(value.getUTCDate())}`;
  return { from: fmt(monday), to: fmt(sunday) };
}

/** Farthest month the calendar may show — current GMT+7 month + 3. */
export function maxFutureYearMonth(now: Date = new Date()): { year: number; month: number } {
  const current = gmt7YearMonth(now);
  return shiftYearMonth(current.year, current.month, 3);
}

/** Last civil day of that farthest month (inclusive upper bound for ranges). */
export function maxFutureCivilDate(now: Date = new Date()): string {
  const { year, month } = maxFutureYearMonth(now);
  return civilMonthRange(year, month).to;
}

export function yearMonthIndex(year: number, month: number): number {
  return year * 12 + (month - 1);
}

/** Next month is blocked once viewing the max-future month; past is unlimited. */
export function canShiftYearMonth(
  year: number,
  month: number,
  delta: number,
  now: Date = new Date(),
): boolean {
  if (delta <= 0) return true;
  const next = shiftYearMonth(year, month, delta);
  const max = maxFutureYearMonth(now);
  return yearMonthIndex(next.year, next.month) <= yearMonthIndex(max.year, max.month);
}

export function civilMonthRangeContaining(civilDate: string): { from: string; to: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) throw new Error("Expected a calendar date");
  return civilMonthRange(Number(match[1]), Number(match[2]));
}

/** Full calendar month after the month that contains `civilDate`. */
export function nextCivilMonthRange(civilDate: string): { from: string; to: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) throw new Error("Expected a calendar date");
  const next = shiftYearMonth(Number(match[1]), Number(match[2]), 1);
  return civilMonthRange(next.year, next.month);
}

/** Civil YYYY-MM-DD ↔ local Date for DayPicker (date-only, no TZ shift). */
export function civilToLocalDate(civilDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(civilDate);
  if (!match) throw new Error("Expected a calendar date");
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
}

export function localDateToCivil(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Clamp a civil range so `to` never exceeds the 3-month future horizon. */
export function clampCivilRangeToHorizon(
  range: { from: string; to: string },
  now: Date = new Date(),
): { from: string; to: string } {
  const max = maxFutureCivilDate(now);
  const to = range.to > max ? max : range.to;
  const from = range.from > to ? to : range.from;
  return { from, to };
}
