import { RRule } from 'rrule'
import type { ClassroomScheduleResponse } from '@the-fundamentals/core-openapi'

import {
  applyTime,
  clockLabel,
  parseCalendarDate,
  splitScheduleRule,
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

export function expandScheduleOccurrences(
  schedules: readonly ClassroomScheduleResponse[],
  range: { start: Date; end: Date },
): Array<ScheduleOccurrence> {
  const events: Array<ScheduleOccurrence> = []
  const rangeStart = utcNoon(range.start)
  const rangeEnd = utcNoon(range.end)

  for (const schedule of schedules) {
    const { dtstart: ruleDtstart, rrule } = splitScheduleRule(schedule.scheduleRule)
    let options
    try {
      options = RRule.parseString(rrule)
    } catch {
      continue
    }

    const seriesStart = schedule.recurrenceStartDate
      ? parseCalendarDate(schedule.recurrenceStartDate)
      : (ruleDtstart ?? range.start)

    // rrule.js still needs a dtstart option; series start lives on the API field, not in scheduleRule.

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

