import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getClassroomByIdOptions } from '@the-fundamentals/core-openapi/react-query'
import { ChevronLeftIcon, SchoolIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { DashboardBreadcrumbs } from '@/components/layout/dashboard-breadcrumbs'
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { getPublicObjectUrl } from '@/features/storage'
import { cn } from '@/lib/utils'

function BannerChip({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cn('rounded-2xl bg-white px-3 py-1.5 shadow-sm', className)}
    >
      {children}
    </div>
  )
}

function BannerChrome({ currentLabel }: { currentLabel?: string }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
      <div className="pointer-events-auto flex min-w-0 items-center gap-2">
        <BannerChip className="flex items-center p-1">
          <SidebarTrigger />
        </BannerChip>
        <BannerChip className="min-w-0 max-w-[min(100%,32rem)] overflow-hidden">
          <DashboardBreadcrumbs currentLabel={currentLabel} />
        </BannerChip>
      </div>
      <BannerChip className="pointer-events-auto shrink-0">
        <Link
          to="/dashboard/classrooms/list"
          className="inline-flex items-center gap-1 text-sm text-foreground"
        >
          <ChevronLeftIcon className="size-4" aria-hidden />
          Classrooms
        </Link>
      </BannerChip>
    </div>
  )
}

function ClassroomDetailsTabs({ classroomId }: { classroomId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const peoplePath = `/dashboard/classrooms/${classroomId}/people`
  const sessionsPath = `/dashboard/classrooms/${classroomId}/sessions`
  const isPeople = pathname === peoplePath
  const isSessions = pathname === sessionsPath
  const isOverview =
    pathname === `/dashboard/classrooms/${classroomId}` ||
    pathname === `/dashboard/classrooms/${classroomId}/`

  const tabClass = (active: boolean) =>
    cn(
      '-mb-px border-b-2 px-1 pb-2.5 text-sm transition-colors',
      active
        ? 'border-foreground font-medium text-foreground'
        : 'border-transparent text-muted-foreground hover:text-foreground',
    )

  return (
    <nav className="flex gap-4 border-b px-4 pt-4" aria-label="Classroom sections">
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
        to="/dashboard/classrooms/$classroomId/sessions"
        params={{ classroomId }}
        className={tabClass(isSessions)}
      >
        Classroom Sessions
      </Link>
    </nav>
  )
}

type ClassroomDetailsLayoutProps = {
  classroomId: string
}

/**
 * Shared classroom chrome (banner, title, tabs) for nested classroom pages.
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
        <div className="relative h-56 bg-muted md:h-64">
          <Skeleton className="size-full rounded-none" />
          <BannerChrome currentLabel="Classroom" />
        </div>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="relative h-56 bg-muted md:h-64">
          <BannerChrome currentLabel="Classroom" />
        </div>
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
      <div className="relative h-56 overflow-hidden bg-muted md:h-64">
        {bannerUrl ? (
          <img src={bannerUrl} alt="" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-[color-mix(in_oklch,var(--sidebar-tint)_12%,var(--muted))]">
            <SchoolIcon
              className="size-12 text-[var(--sidebar-tint)] opacity-40"
              aria-hidden
            />
          </div>
        )}
        <BannerChrome currentLabel={data.name} />
      </div>

      <ClassroomDetailsTabs classroomId={classroomId} />

      <div className="px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
