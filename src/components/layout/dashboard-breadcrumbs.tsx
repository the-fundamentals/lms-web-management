import { Link, useRouterState } from '@tanstack/react-router'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Overview',
  '/dashboard/users': 'Users',
  '/dashboard/courses': 'Courses',
  '/dashboard/settings': 'Settings',
  '/dashboard/classrooms': 'Overview',
  '/dashboard/classrooms/list': 'Classrooms',
  '/dashboard/classrooms/students': 'Students',
  '/dashboard/classrooms/schedule': 'Schedule',
}

function normalizePath(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

export function DashboardBreadcrumbs({
  currentLabel,
}: {
  currentLabel?: string
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const path = normalizePath(pathname)
  const pageLabel =
    currentLabel ??
    PAGE_LABELS[path] ??
    (path.startsWith('/dashboard/classrooms/') ? 'Classroom' : 'Dashboard')
  const isTeaching = path.startsWith('/dashboard/classrooms')

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {isTeaching ? (
          <>
            <BreadcrumbItem className="hidden md:block">
              <BreadcrumbLink asChild>
                <Link to="/dashboard/classrooms">Teaching</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            <BreadcrumbItem>
              <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </>
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
