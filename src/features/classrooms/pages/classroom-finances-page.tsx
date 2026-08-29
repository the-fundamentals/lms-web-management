import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import type { ClassroomMemberResponse } from '@the-fundamentals/core-openapi'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { getAllClassroomMembersOptions } from '@the-fundamentals/core-openapi/react-query'

const financesRoute = getRouteApi(
  '/dashboard/classrooms/$classroomId/finances',
)

/** Sample per-session rates (VND). No classroom revenue API yet. */
const PLACEHOLDER_RATES_VND = [120_000, 150_000, 180_000, 200_000, 250_000]

const vnd = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
})

function hashId(id: string): number {
  let n = 0
  for (let i = 0; i < id.length; i++) {
    n = (n * 31 + id.charCodeAt(i)) >>> 0
  }
  return n
}

function placeholderRate(id: string): number {
  return PLACEHOLDER_RATES_VND[hashId(id) % PLACEHOLDER_RATES_VND.length]
}

function placeholderSessionsBilled(id: string): number {
  return 4 + (hashId(id) % 9)
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) {
    return '?'
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
}

type StudentRevenue = {
  member: ClassroomMemberResponse
  rate: number
  sessions: number
  billed: number
}

function RevenueRow({ row }: { row: StudentRevenue }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Avatar>
        <AvatarFallback>{initialsFromName(row.member.name)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{row.member.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          Per session · {vnd.format(row.rate)} × {row.sessions}
        </p>
      </div>
      <p className="shrink-0 text-sm font-medium tabular-nums">
        {vnd.format(row.billed)}
      </p>
    </li>
  )
}

export function ClassroomFinancesPage() {
  const { classroomId } = financesRoute.useParams()

  const { data = [], error, isPending, isError, refetch, isFetching } =
    useQuery(
      getAllClassroomMembersOptions({
        path: { classroomId },
      }),
    )

  const rows = useMemo((): StudentRevenue[] => {
    return data
      .filter(
        (member) => member.status === 'ACTIVE' && member.role === 'STUDENT',
      )
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((member) => {
        const rate = placeholderRate(member.id)
        const sessions = placeholderSessionsBilled(member.id)
        return {
          member,
          rate,
          sessions,
          billed: rate * sessions,
        }
      })
  }, [data])

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.billed, 0),
    [rows],
  )
  const sessionCount = useMemo(
    () => rows.reduce((sum, row) => sum + row.sessions, 0),
    [rows],
  )

  if (isPending) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <Skeleton className="h-20 w-56" />
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
            : 'Could not load classroom finances.'}
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
      <section>
        <p className="text-[10px] font-medium tracking-[0.16em] text-[var(--sidebar-tint)] uppercase">
          Revenue
        </p>
        <p className="font-heading mt-1 text-4xl font-medium tracking-tight tabular-nums">
          {vnd.format(total)}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          {rows.length === 0
            ? 'No billed students yet.'
            : `${rows.length === 1 ? '1 student' : `${rows.length} students`} · ${sessionCount === 1 ? '1 session' : `${sessionCount} sessions`} billed`}
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-lg font-medium tracking-tight">Students</h2>
          <span className="text-sm text-muted-foreground">Per session</span>
        </div>
        <Separator />
        {rows.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No students yet.
          </p>
        ) : (
          <ul className="divide-y">
            {rows.map((row) => (
              <RevenueRow key={row.member.id} row={row} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
