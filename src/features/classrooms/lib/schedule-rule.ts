import type { RecurrenceByDay } from '@the-fundamentals/core-openapi'

export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export const WEEKDAYS = [
  { ical: 'SU', byDay: 'SUNDAY', label: 'S', name: 'Sunday' },
  { ical: 'MO', byDay: 'MONDAY', label: 'M', name: 'Monday' },
  { ical: 'TU', byDay: 'TUESDAY', label: 'T', name: 'Tuesday' },
  { ical: 'WE', byDay: 'WEDNESDAY', label: 'W', name: 'Wednesday' },
  { ical: 'TH', byDay: 'THURSDAY', label: 'T', name: 'Thursday' },
  { ical: 'FR', byDay: 'FRIDAY', label: 'F', name: 'Friday' },
  { ical: 'SA', byDay: 'SATURDAY', label: 'S', name: 'Saturday' },
] as const satisfies ReadonlyArray<{
  ical: string
  byDay: RecurrenceByDay
  label: string
  name: string
}>

export function weekdayIcalForDate(date: Date): (typeof WEEKDAYS)[number]['ical'] {
  return WEEKDAYS[date.getDay()].ical
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

export function toIsoDateLocal(date: Date): string {
  const year = String(date.getFullYear())
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toIcalDate(isoDate: string): string {
  return isoDate.replaceAll('-', '')
}

/** First day the rule can fire, from `from` (inclusive). Weekly uses BYDAY. */
export function firstOccurrenceDate({
  freq,
  byDays,
  from = new Date(),
}: {
  freq: RecurrenceFreq
  byDays: ReadonlySet<string>
  from?: Date
}): Date {
  const start = startOfLocalDay(from)
  if (freq !== 'WEEKLY' || byDays.size === 0) {
    return start
  }
  for (let offset = 0; offset < 7; offset += 1) {
    const candidate = new Date(start)
    candidate.setDate(start.getDate() + offset)
    if (byDays.has(weekdayIcalForDate(candidate))) {
      return candidate
    }
  }
  return start
}

export function parseCalendarDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return parseIcalDate(value)
}

function parseIcalDate(value: string): Date {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  if (value.includes('T') && value.length >= 15) {
    const hour = Number(value.slice(9, 11))
    const minute = Number(value.slice(11, 13))
    const second = Number(value.slice(13, 15))
    if (value.endsWith('Z')) {
      return new Date(Date.UTC(year, month - 1, day, hour, minute, second))
    }
    return new Date(year, month - 1, day, hour, minute, second)
  }
  return new Date(year, month - 1, day)
}

function formatUntilDate(value: string): string {
  const date = parseIcalDate(value)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Human copy for one weekly recurrence row (API stores a single byDay, not an iCal string). */
export function describeRecurrence({
  byDay,
  recurUntil,
}: {
  byDay: RecurrenceByDay
  recurUntil?: string
}): string {
  const name = WEEKDAYS.find((day) => day.byDay === byDay)?.name ?? byDay
  let text = `Weekly on ${name}`
  if (recurUntil) {
    text += `, until ${formatUntilDate(toIcalDate(recurUntil))}`
  }
  return text
}

export function clockLabel(time: string): string {
  const [hour = '00', minute = '00'] = time.split(':')
  return `${hour}:${minute}`
}

/** Match recurrence slots to cancelled rows (date + wall-clock times). */
export function occurrenceSlotKey(
  date: Date | string,
  startTime: string,
  endTime: string,
): string {
  const iso =
    typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date)
      ? date.slice(0, 10)
      : toIsoDateLocal(typeof date === 'string' ? parseCalendarDate(date) : date)
  return `${iso}|${clockLabel(startTime)}|${clockLabel(endTime)}`
}

export function applyTime(day: Date, time: string): Date {
  const [hour = '0', minute = '0', second = '0'] = time.split(':')
  return new Date(
    day.getFullYear(),
    day.getMonth(),
    day.getDate(),
    Number(hour),
    Number(minute),
    Number(second),
  )
}

export function toLocalDateTimeIso(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
