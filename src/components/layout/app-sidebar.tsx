import {
  CalendarIcon,
  LayoutDashboardIcon,
  ListIcon,
  SchoolIcon,
  UsersIcon,
} from 'lucide-react'

import { AppBrand } from '@/components/layout/app-brand'
import { NavMain } from '@/components/layout/nav-main'
import { NavUser } from '@/components/layout/nav-user'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const teachingNav = [
  {
    title: 'Overview',
    url: '/dashboard/classrooms',
    icon: <SchoolIcon />,
  },
  {
    title: 'Classrooms',
    url: '/dashboard/classrooms/list',
    icon: <ListIcon />,
  },
  {
    title: 'Students',
    url: '/dashboard/classrooms/students',
    icon: <UsersIcon />,
  },
  {
    title: 'Schedule',
    url: '/dashboard/classrooms/schedule',
    icon: <CalendarIcon />,
  },
]

const dashboardNav = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: <LayoutDashboardIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={dashboardNav} />
        <NavMain label="Teaching" items={teachingNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
