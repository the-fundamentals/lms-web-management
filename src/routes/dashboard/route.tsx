import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { AppSidebar } from '@/components/layout/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { requireAccountProfile } from '@/features/account'
import { requireAuthenticated } from '@/features/auth'

export const Route = createFileRoute('/dashboard')({
  // Applies to /dashboard and every nested page under this layout.
  beforeLoad: async ({ context }) => {
    await requireAuthenticated()
    await requireAccountProfile(context.queryClient)
  },
  component: DashboardLayout,
})

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

function DashboardBreadcrumbs() {
  const pathname = useRouterState({ select: (s) => s.location.pathname })
  const path = normalizePath(pathname)
  const pageLabel = PAGE_LABELS[path] ?? 'Dashboard'
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

function DashboardLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-vertical:h-4 data-vertical:self-auto"
            />
            <DashboardBreadcrumbs />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
