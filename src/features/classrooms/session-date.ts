export function parseSessionDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

function hasClockTime(value: string, date: Date): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  return (
    date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0
  )
}

export function formatSessionDateTime(sessionDate: string): string {
  const date = parseSessionDate(sessionDate)
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)

  if (!hasClockTime(sessionDate, date)) {
    return dateLabel
  }

  const timeLabel = new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)

  return `${dateLabel} · ${timeLabel}`
}

export function formatSessionTime(sessionDate: string): string | null {
  const date = parseSessionDate(sessionDate)
  if (!hasClockTime(sessionDate, date)) {
    return null
  }
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date)
}
