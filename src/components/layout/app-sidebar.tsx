import {
  BookOpenIcon,
  CalendarIcon,
  LayoutDashboardIcon,
  ListIcon,
  SchoolIcon,
  SettingsIcon,
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

const managementNav = [
  {
    title: 'Overview',
    url: '/dashboard',
    icon: <LayoutDashboardIcon />,
  },
  {
    title: 'Users',
    url: '/dashboard/users',
    icon: <UsersIcon />,
  },
  {
    title: 'Courses',
    url: '/dashboard/courses',
    icon: <BookOpenIcon />,
  },
  {
    title: 'Settings',
    url: '/dashboard/settings',
    icon: <SettingsIcon />,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <AppBrand />
      </SidebarHeader>
      <SidebarContent>
        <NavMain label="Teaching" items={teachingNav} />
        <NavMain label="Management" items={managementNav} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
