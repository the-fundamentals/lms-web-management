import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi } from '@tanstack/react-router'
import type { ClassroomSessionResponse } from '@the-fundamentals/core-openapi'
import { PlusIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CreateSessionDialog } from '@/features/classrooms/components/create-session-dialog'
import { getAllClassroomSessionsOptions } from '@/features/classrooms/classrooms-query'
import {
  formatSessionTime,
  parseSessionDate,
} from '@/features/classrooms/session-date'

const sessionsRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/sessions/',
)

function SessionRow({
  classroomId,
  session,
  index,
}: {
  classroomId: string
  session: ClassroomSessionResponse
  index: number
}) {
  const date = parseSessionDate(session.sessionDate)
  const weekday = new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(
    date,
  )
  const dayNumber = new Intl.DateTimeFormat(undefined, { day: '2-digit' }).format(
    date,
  )
  const monthYear = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(date)
  const time = formatSessionTime(session.sessionDate)
  const name = session.name?.trim() || 'Untitled session'
  const description = session.description?.trim()

  return (
    <li
      className="animate-in fade-in-0 slide-in-from-bottom-1 fill-mode-both"
      style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
    >
      <Link
        to="/dashboard/classrooms/$classroomId/sessions/$sessionId"
        params={{ classroomId, sessionId: session.id }}
        className="flex gap-4 py-4"
      >
        <div className="flex w-14 shrink-0 flex-col items-center">
          <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-[var(--sidebar-tint)]">
            {weekday}
          </span>
          <span className="mt-0.5 font-heading text-2xl leading-none font-medium tabular-nums tracking-tight">
            {dayNumber}
          </span>
          <span className="mt-1 text-[10px] text-muted-foreground">
            {monthYear}
          </span>
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-transparent px-3 py-2.5 transition-colors hover:border-border hover:bg-[color-mix(in_oklch,var(--sidebar-tint)_5%,var(--background))]">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium">{name}</p>
            {time ? (
              <time
                dateTime={session.sessionDate}
                className="shrink-0 text-xs tabular-nums text-muted-foreground"
              >
                {time}
              </time>
            ) : null}
          </div>
          {description ? (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  )
}

export function ClassroomSessionsPage() {
  const { classroomId } = sessionsRoute.useParams()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
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

  const sessions = useMemo(
    () =>
      data.slice().sort((a, b) => {
        return (
          parseSessionDate(b.sessionDate).getTime() -
          parseSessionDate(a.sessionDate).getTime()
        )
      }),
    [data],
  )

  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-3">
        <Skeleton className="h-6 w-28" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
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
    <section className="flex max-w-3xl flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-baseline gap-3">
          <h2 className="text-lg font-medium tracking-tight">Sessions</h2>
          <span className="text-sm text-muted-foreground">
            {sessions.length === 1 ? '1 session' : `${sessions.length} sessions`}
          </span>
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label="Create session"
              onClick={() => setIsCreateOpen(true)}
            >
              <PlusIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Create session</TooltipContent>
        </Tooltip>
      </div>
      <Separator />
      {sessions.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          No sessions yet.
        </p>
      ) : (
        <ul className="divide-y">
          {sessions.map((session, index) => (
            <SessionRow
              key={session.id}
              classroomId={classroomId}
              session={session}
              index={index}
            />
          ))}
        </ul>
      )}
      <CreateSessionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        classroomId={classroomId}
      />
    </section>
  )
}
