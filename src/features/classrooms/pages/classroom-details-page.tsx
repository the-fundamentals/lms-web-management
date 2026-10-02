import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getClassroomByIdOptions } from '@the-fundamentals/core-openapi/react-query'
import { ChevronLeftIcon, SchoolIcon } from 'lucide-react'

import { DashboardBreadcrumbs } from '@/components/layout/dashboard-breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { getPublicObjectUrl } from '@/features/storage'
import { cn } from '@/lib/utils'

function ClassroomDetailsToolbar({
  currentLabel,
}: {
  currentLabel?: string
}) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator
        orientation="vertical"
        className="mr-2 data-vertical:h-4 data-vertical:self-auto"
      />
      <div className="min-w-0 flex-1 overflow-hidden">
        <DashboardBreadcrumbs currentLabel={currentLabel} />
      </div>
      <Button type="button" variant="ghost" size="sm" asChild>
        <Link to="/dashboard/classrooms/list">
          <ChevronLeftIcon aria-hidden />
          Classrooms
        </Link>
      </Button>
    </header>
  )
}

function ClassroomDetailsTabs({ classroomId }: { classroomId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const peoplePath = `/dashboard/classrooms/${classroomId}/people`
  const schedulePath = `/dashboard/classrooms/${classroomId}/schedule`
  const financesPath = `/dashboard/classrooms/${classroomId}/finances`
  const isPeople =
    pathname === peoplePath || pathname.startsWith(`${peoplePath}/`)
  const isSchedule =
    pathname === schedulePath || pathname.startsWith(`${schedulePath}/`)
  const isFinances =
    pathname === financesPath || pathname.startsWith(`${financesPath}/`)
  const isOverview =
    pathname === `/dashboard/classrooms/${classroomId}` ||
    pathname === `/dashboard/classrooms/${classroomId}/`

  const tabClass = (active: boolean) =>
    cn(
      'inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm transition-colors',
      active
        ? 'bg-background font-medium text-foreground shadow-sm'
        : 'text-muted-foreground hover:text-foreground',
    )

  return (
    <nav
      className="inline-flex h-9 max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted p-1"
      aria-label="Classroom sections"
    >
      <Link
        to="/dashboard/classrooms/$classroomId"
        params={{ classroomId }}
        className={tabClass(isOverview)}
      >
        Overview
      </Link>
      <Link
        to="/dashboard/classrooms/$classroomId/people"
        params={{ classroomId }}
        className={tabClass(isPeople)}
      >
        People
      </Link>
      <Link
        to="/dashboard/classrooms/$classroomId/schedule"
        params={{ classroomId }}
        className={tabClass(isSchedule)}
      >
        Schedule
      </Link>
      <Link
        to="/dashboard/classrooms/$classroomId/finances"
        params={{ classroomId }}
        className={tabClass(isFinances)}
      >
        Finances
      </Link>
    </nav>
  )
}

function memberCountLabel(count: number): string {
  return count === 1 ? '1 member' : `${count} members`
}

type ClassroomDetailsLayoutProps = {
  classroomId: string
}

/**
 * Shared classroom chrome (toolbar, banner, title, tabs) for nested classroom pages.
 *
 * Toolbar mirrors the dashboard header (tokens only) instead of floating white chips on the banner.
 */
export function ClassroomDetailsLayout({
  classroomId,
}: ClassroomDetailsLayoutProps) {
  const { data, error, isPending, isError, refetch, isFetching } = useQuery(
    getClassroomByIdOptions({ path: { id: classroomId } }),
  )

  if (isPending) {
    return (
      <div className="flex flex-1 flex-col">
        <ClassroomDetailsToolbar currentLabel="Classroom" />
        <Skeleton className="h-40 w-full rounded-none md:h-48" />
        <div className="flex flex-col gap-3 border-b px-4 py-4">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-9 w-80" />
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-1 flex-col">
        <ClassroomDetailsToolbar currentLabel="Classroom" />
        <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-4">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error
              ? error.message
              : 'Could not load this classroom.'}
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
      </div>
    )
  }

  const bannerUrl = getPublicObjectUrl(data.bannerKey)

  return (
    <div className="flex flex-1 flex-col">
      <ClassroomDetailsToolbar currentLabel={data.name} />

      <div className="relative h-40 overflow-hidden bg-muted md:h-48">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-primary-softer">
            <SchoolIcon
              className="size-12 text-primary opacity-40"
              aria-hidden
            />
          </div>
        )}
        {/* Soft fade into the surface so the banner meets the title strip cleanly */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background to-transparent"
          aria-hidden
        />
      </div>

      <div className="flex flex-col gap-4 border-b px-4 pb-0 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">{data.name}</h1>
          <Badge variant="secondary">{memberCountLabel(data.numberOfMembers)}</Badge>
          {data.status === 'ARCHIVED' ? (
            <Badge variant="outline">Archived</Badge>
          ) : null}
        </div>
        <div className="pb-3">
          <ClassroomDetailsTabs classroomId={classroomId} />
        </div>
      </div>

      <div className="px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
