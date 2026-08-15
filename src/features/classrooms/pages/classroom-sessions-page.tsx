import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ClassroomSessionResponse } from '@the-fundamentals/core-openapi'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllClassroomSessionsOptions } from '@/features/classrooms/classrooms-query'
import { cn } from '@/lib/utils'

const sessionsRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/sessions',
)

function parseSessionDate(value: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-').map(Number)
    return new Date(year, month - 1, day)
  }
  return new Date(value)
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function hasClockTime(value: string, date: Date): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false
  }
  return date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0
}

function relativeDayLabel(sessionDay: Date, today: Date): string {
  const diffDays = Math.round(
    (startOfLocalDay(sessionDay).getTime() - today.getTime()) / 86_400_000,
  )
  if (diffDays === 0) {
    return 'Today'
  }
  if (diffDays === 1) {
    return 'Tomorrow'
  }
  if (diffDays === -1) {
    return 'Yesterday'
  }
  if (diffDays > 1 && diffDays < 7) {
    return `In ${diffDays} days`
  }
  if (diffDays < -1 && diffDays > -7) {
    return `${Math.abs(diffDays)} days ago`
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    sessionDay,
  )
}

function SessionRow({ session }: { session: ClassroomSessionResponse }) {
  const date = parseSessionDate(session.sessionDate)
  const today = startOfLocalDay(new Date())
  const isPast = startOfLocalDay(date).getTime() < today.getTime()
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    date,
  )
  const dayNumber = new Intl.DateTimeFormat(undefined, { day: 'numeric' }).format(
    date,
  )
  const fullDate = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
  const time = hasClockTime(session.sessionDate, date)
    ? new Intl.DateTimeFormat(undefined, {
        hour: 'numeric',
        minute: '2-digit',
      }).format(date)
    : null

  return (
    <li className="flex items-center gap-4 py-3">
      <div
        className={cn(
          'flex size-12 shrink-0 flex-col items-center justify-center rounded-xl border',
          isPast
            ? 'border-border text-muted-foreground'
            : 'border-[color-mix(in_oklch,var(--sidebar-tint)_35%,var(--border))] bg-[color-mix(in_oklch,var(--sidebar-tint)_8%,transparent)] text-foreground',
        )}
      >
        <span className="text-[10px] font-medium uppercase leading-none tracking-wide">
          {weekday}
        </span>
        <span className="mt-0.5 text-base font-medium leading-none">
          {dayNumber}
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium">{fullDate}</p>
        <p className="truncate text-xs text-muted-foreground">
          {relativeDayLabel(date, today)}
          {time ? (
            <>
              <span className="mx-1.5 text-border" aria-hidden>
                ·
              </span>
              {time}
            </>
          ) : null}
        </p>
      </div>
    </li>
  )
}

function SessionSection({
  title,
  sessions,
  emptyLabel,
}: {
  title: string
  sessions: ClassroomSessionResponse[]
  emptyLabel: string
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-lg font-medium tracking-tight">{title}</h2>
        <span className="text-sm text-muted-foreground">
          {sessions.length === 1 ? '1 session' : `${sessions.length} sessions`}
        </span>
      </div>
      <Separator />
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{emptyLabel}</p>
      ) : (
        <ul className="divide-y">
          {sessions.map((session) => (
            <SessionRow key={session.id} session={session} />
          ))}
        </ul>
      )}
    </section>
  )
}

export function ClassroomSessionsPage() {
  const { classroomId } = sessionsRoute.useParams()
  const { data = [], error, isPending, isError, refetch, isFetching } =
    useQuery(
      getAllClassroomSessionsOptions({
        path: { classroomId },
        body: {
          page: 0,
          size: 50,
        },
      }),
    )

  const { upcoming, past } = useMemo(() => {
    const today = startOfLocalDay(new Date()).getTime()
    const sorted = data.slice().sort((a, b) => {
      return (
        parseSessionDate(a.sessionDate).getTime() -
        parseSessionDate(b.sessionDate).getTime()
      )
    })
    return {
      upcoming: sorted.filter(
        (session) => parseSessionDate(session.sessionDate).getTime() >= today,
      ),
      past: sorted
        .filter(
          (session) => parseSessionDate(session.sessionDate).getTime() < today,
        )
        .reverse(),
    }
  }, [data])

  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex min-h-48 flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive" role="alert">
          {error instanceof Error
            ? error.message
            : 'Could not load classroom sessions.'}
        </p>
        <Button
          type="button"
          variant="outline"
          className="rounded-md"
          disabled={isFetching}
          onClick={() => void refetch()}
        >
          Try again
        </Button>
      </div>
    )
  }

  return (
    <div className="flex max-w-3xl flex-col gap-8">
      <SessionSection
        title="Upcoming"
        sessions={upcoming}
        emptyLabel="No upcoming sessions."
      />
      <SessionSection
        title="Past"
        sessions={past}
        emptyLabel="No past sessions."
      />
    </div>
  )
}
