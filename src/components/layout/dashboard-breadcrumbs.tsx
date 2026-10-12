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
  '/dashboard/classrooms/new': 'New classroom',
}

/** Fixed classroom section routes (not a classroom id). */
const CLASSROOM_SECTION_SEGMENTS = new Set([
  'list',
  'students',
  'schedule',
  'new',
])

function normalizePath(pathname: string) {
  if (pathname !== '/' && pathname.endsWith('/')) {
    return pathname.slice(0, -1)
  }
  return pathname
}

function isClassroomObjectPath(path: string): boolean {
  if (!path.startsWith('/dashboard/classrooms/')) {
    return false
  }
  const segment = path.split('/')[3] ?? ''
  return segment.length > 0 && !CLASSROOM_SECTION_SEGMENTS.has(segment)
}

function knownPageLabel(path: string): string | undefined {
  if (Object.hasOwn(PAGE_LABELS, path)) {
    return PAGE_LABELS[path]
  }
  return undefined
}

export function DashboardBreadcrumbs({
  currentLabel,
}: {
  currentLabel?: string
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const path = normalizePath(pathname)
  const inClassrooms = path.startsWith('/dashboard/classrooms')
  const onClassroomObject = isClassroomObjectPath(path)
  const pageLabel =
    currentLabel ??
    knownPageLabel(path) ??
    (onClassroomObject ? 'Classroom' : 'Dashboard')

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem className="hidden md:block">
          <BreadcrumbLink asChild>
            <Link to="/dashboard">Dashboard</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator className="hidden md:block" />
        {inClassrooms ? (
          onClassroomObject || currentLabel ? (
            <>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link to="/dashboard/classrooms/list">Classrooms</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <BreadcrumbItem>
              <BreadcrumbPage>
                {path === '/dashboard/classrooms/list' ||
                path === '/dashboard/classrooms'
                  ? 'Classrooms'
                  : pageLabel}
              </BreadcrumbPage>
            </BreadcrumbItem>
          )
        ) : (
          <BreadcrumbItem>
            <BreadcrumbPage>{pageLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
