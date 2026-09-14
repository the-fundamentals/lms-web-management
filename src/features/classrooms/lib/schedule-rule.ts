export type RecurrenceFreq = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

export const WEEKDAYS = [
  { ical: 'SU', label: 'S', name: 'Sunday' },
  { ical: 'MO', label: 'M', name: 'Monday' },
  { ical: 'TU', label: 'T', name: 'Tuesday' },
  { ical: 'WE', label: 'W', name: 'Wednesday' },
  { ical: 'TH', label: 'T', name: 'Thursday' },
  { ical: 'FR', label: 'F', name: 'Friday' },
  { ical: 'SA', label: 'S', name: 'Saturday' },
] as const

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

export function buildScheduleRule({
  freq,
  interval,
  byDays,
  until,
  count,
}: {
  freq: RecurrenceFreq
  interval: number
  byDays: ReadonlySet<string>
  until?: string
  count?: number
}): string {
  const parts = [`FREQ=${freq}`, `INTERVAL=${interval}`]
  if (freq === 'WEEKLY') {
    const ordered = WEEKDAYS.map((day) => day.ical).filter((ical) =>
      byDays.has(ical),
    )
    parts.push(`BYDAY=${ordered.join(',')}`)
  }
  if (count != null) {
    parts.push(`COUNT=${count}`)
  } else if (until) {
    parts.push(`UNTIL=${toIcalDate(until)}`)
  }
  return parts.join(';')
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

function joinEnglish(items: readonly string[]): string {
  if (items.length === 0) {
    return ''
  }
  if (items.length === 1) {
    return items[0]
  }
  if (items.length === 2) {
    return `${items[0]} and ${items[1]}`
  }
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

function frequencyPhrase(freq: string, interval: number): string | undefined {
  const n = interval < 1 ? 1 : interval
  switch (freq) {
    case 'DAILY':
      return n === 1 ? 'Every day' : `Every ${n} days`
    case 'WEEKLY':
      return n === 1 ? 'Weekly' : `Every ${n} weeks`
    case 'MONTHLY':
      return n === 1 ? 'Every month' : `Every ${n} months`
    case 'YEARLY':
      return n === 1 ? 'Every year' : `Every ${n} years`
    default:
      return undefined
  }
}

function formatUntilDate(value: string): string {
  const date = parseIcalDate(value)
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Human copy for stored RRULEs (not rrule.toText — matches create-dialog wording). */
export function describeScheduleRule(rule: string): string {
  const { rrule } = splitScheduleRule(rule)
  const fields = new Map<string, string>()
  for (const part of rrule.split(';').filter(Boolean)) {
    const eq = part.indexOf('=')
    const key = (eq === -1 ? part : part.slice(0, eq)).toUpperCase()
    const value = eq === -1 ? '' : part.slice(eq + 1)
    fields.set(key, value)
  }

  const freq = fields.get('FREQ') ?? ''
  const interval = Number(fields.get('INTERVAL') ?? '1')
  const lead = frequencyPhrase(freq, Number.isFinite(interval) ? interval : 1)
  if (!lead) {
    return rule
  }

  const chunks = [lead]
  if (freq === 'WEEKLY' && fields.has('BYDAY')) {
    const selected = new Set(
      fields
        .get('BYDAY')!
        .split(',')
        .map((token) => token.trim().toUpperCase()),
    )
    const names = WEEKDAYS.filter((day) => selected.has(day.ical)).map(
      (day) => day.name,
    )
    if (names.length > 0) {
      chunks.push(`on ${joinEnglish(names)}`)
    }
  }

  let text = chunks.join(' ')
  const count = Number(fields.get('COUNT') ?? '')
  if (Number.isFinite(count) && count > 0) {
    text += `, after ${count} occurrence${count === 1 ? '' : 's'}`
  } else if (fields.has('UNTIL')) {
    text += `, until ${formatUntilDate(fields.get('UNTIL')!)}`
  }

  return text
}

export function splitScheduleRule(rule: string): {
  dtstart?: Date
  rrule: string
} {
  const parts = rule.split(';').filter(Boolean)
  let dtstart: Date | undefined
  const rest: Array<string> = []
  for (const part of parts) {
    const eq = part.indexOf('=')
    const key = (eq === -1 ? part : part.slice(0, eq)).toUpperCase()
    const value = eq === -1 ? '' : part.slice(eq + 1)
    if (key === 'DTSTART') {
      dtstart = parseIcalDate(value)
    } else {
      rest.push(part)
    }
  }
  return { dtstart, rrule: rest.join(';') }
}

export function clockLabel(time: string): string {
  const [hour = '00', minute = '00'] = time.split(':')
  return `${hour}:${minute}`
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
