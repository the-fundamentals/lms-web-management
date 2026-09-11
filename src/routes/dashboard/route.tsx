import { Link, Outlet, createFileRoute, useRouterState } from '@tanstack/react-router'

import { AppSidebar } from '@/components/layout/app-sidebar'
import { DashboardBreadcrumbs } from '@/components/layout/dashboard-breadcrumbs'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { requireAccountProfile } from '@/features/account'
import { requireAuthenticated } from '@/features/auth'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/dashboard')({
  // Applies to /dashboard and every nested page under this layout.
  beforeLoad: async ({ context }) => {
    await requireAuthenticated()
    await requireAccountProfile(context.queryClient)
  },
  component: DashboardLayout,
})

function DashboardLayout() {
  const isClassroomDetails = useRouterState({
    select: (s) =>
      s.matches.some((match) =>
        String(match.routeId).startsWith('/dashboard/classrooms/$classroomId'),
      ),
  })

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {isClassroomDetails ? null : (
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
        )}
        <div
          className={cn(
            'flex flex-1 flex-col',
            isClassroomDetails ? '' : 'gap-4 p-4 pt-0',
          )}
        >
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
