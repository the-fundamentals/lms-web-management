import { Link, Outlet, useRouterState } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { getClassroomByIdOptions } from '@the-fundamentals/core-openapi/react-query'
import { SchoolIcon } from 'lucide-react'

import { DashboardBreadcrumbs } from '@/components/layout/dashboard-breadcrumbs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { getPublicObjectUrl } from '@/features/storage'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'overview', label: 'Overview', to: '/dashboard/classrooms/$classroomId' },
  {
    id: 'people',
    label: 'People',
    to: '/dashboard/classrooms/$classroomId/people',
  },
  {
    id: 'schedule',
    label: 'Schedule',
    to: '/dashboard/classrooms/$classroomId/schedule',
  },
  {
    id: 'billing',
    label: 'Billing',
    to: '/dashboard/classrooms/$classroomId/billing',
  },
] as const

function ClassroomDetailsToolbar({
  currentLabel,
}: {
  currentLabel?: string
}) {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex min-w-0 flex-1 items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 data-vertical:h-4 data-vertical:self-auto"
        />
        <div className="min-w-0 flex-1 overflow-hidden">
          <DashboardBreadcrumbs currentLabel={currentLabel} />
        </div>
      </div>
    </header>
  )
}

function ClassroomDetailsTabs({ classroomId }: { classroomId: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const base = `/dashboard/classrooms/${classroomId}`

  const activeId = (() => {
    if (pathname === `${base}/people` || pathname.startsWith(`${base}/people/`)) {
      return 'people'
    }
    if (
      pathname === `${base}/schedule` ||
      pathname.startsWith(`${base}/schedule/`)
    ) {
      return 'schedule'
    }
    if (
      pathname === `${base}/billing` ||
      pathname.startsWith(`${base}/billing/`)
    ) {
      return 'billing'
    }
    return 'overview'
  })()

  return (
    <nav
      className="-mb-px flex gap-1 overflow-x-auto"
      aria-label="Classroom sections"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeId
        return (
          <Link
            key={tab.id}
            to={tab.to}
            params={{ classroomId }}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors',
              active
                ? 'border-primary font-medium text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}

function peopleCountLabel(count: number): string {
  return count === 1 ? '1 person' : `${count} people`
}

type ClassroomDetailsLayoutProps = {
  classroomId: string
}

/**
 * Classroom details chrome: dashboard-aligned toolbar, compact identity header, underline tabs.
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
        <div className="flex flex-col gap-4 border-b px-4 py-4">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-40 shrink-0 rounded-xl" />
            <div className="flex flex-1 flex-col justify-center gap-2">
              <Skeleton className="h-7 w-56" />
              <Skeleton className="h-5 w-28" />
            </div>
          </div>
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

      <div className="border-b">
        <div className="flex flex-col gap-4 px-4 pt-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="relative h-28 w-full shrink-0 overflow-hidden rounded-xl bg-muted sm:h-24 sm:w-44">
              {bannerUrl ? (
                <img
                  src={bannerUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-primary-softer">
                  <SchoolIcon
                    className="size-8 text-primary opacity-50"
                    aria-hidden
                  />
                </div>
              )}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-center gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold tracking-tight">
                  {data.name}
                </h1>
                {data.status === 'ARCHIVED' ? (
                  <Badge variant="outline">Archived</Badge>
                ) : (
                  <Badge variant="secondary">Active</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {peopleCountLabel(data.numberOfMembers)}
              </p>
            </div>
          </div>

          <ClassroomDetailsTabs classroomId={classroomId} />
        </div>
      </div>

      <div className="px-4 py-6">
        <Outlet />
      </div>
    </div>
  )
}
