import { RRule } from 'rrule'
import type { ClassroomScheduleRecurrenceResponse } from '@the-fundamentals/core-openapi'

import {
  WEEKDAYS,
  applyTime,
  clockLabel,
  parseCalendarDate,
  toIcalDate,
  toIsoDateLocal,
} from '@/features/classrooms/lib/schedule-rule'

export type ScheduleOccurrence = {
  id: string
  scheduleId: string
  title: string
  start: Date
  end: Date
  date: string
  startTime: string
  endTime: string
}

/** Noon UTC so rrule (UTC-based) does not shift the civil date. */
function utcNoon(date: Date): Date {
  return new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0),
  )
}

function localDayFromUtc(date: Date): Date {
  return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
}

function weeklyRrule(schedule: ClassroomScheduleRecurrenceResponse): string | undefined {
  const ical = WEEKDAYS.find((day) => day.byDay === schedule.byDay)?.ical
  if (!ical) {
    return undefined
  }
  const parts = [`FREQ=${schedule.frequency}`, `BYDAY=${ical}`]
  if (schedule.recurUntil) {
    parts.push(`UNTIL=${toIcalDate(schedule.recurUntil)}`)
  }
  return parts.join(';')
}

export function expandScheduleOccurrences(
  schedules: readonly ClassroomScheduleRecurrenceResponse[],
  range: { start: Date; end: Date },
): Array<ScheduleOccurrence> {
  const events: Array<ScheduleOccurrence> = []
  const rangeStart = utcNoon(range.start)
  const rangeEnd = utcNoon(range.end)

  for (const schedule of schedules) {
    // Bridge until the calendar reads generated sessions: one WEEKLY byDay row expands locally.
    const rrule = weeklyRrule(schedule)
    if (!rrule) {
      continue
    }
    let options
    try {
      options = RRule.parseString(rrule)
    } catch {
      continue
    }

    const seriesStart = parseCalendarDate(schedule.recurrenceStartDate)

    const rule = new RRule({
      ...options,
      dtstart: utcNoon(seriesStart),
    })

    for (const date of rule.between(rangeStart, rangeEnd, true)) {
      const day = localDayFromUtc(date)
      const start = applyTime(day, schedule.startTime)
      const end = applyTime(day, schedule.endTime)
      events.push({
        id: `${schedule.id}-${start.getTime()}`,
        scheduleId: schedule.id,
        title: `${clockLabel(schedule.startTime)} – ${clockLabel(schedule.endTime)}`,
        start,
        end,
        date: toIsoDateLocal(day),
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      })
    }
  }

  return events
}

