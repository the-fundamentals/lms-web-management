import {
  AudioLinesIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  MapIcon,
  PieChartIcon,
  SchoolIcon,
  TerminalIcon,
  UsersIcon,
} from 'lucide-react'

import { NavMain } from '@/components/sidebar/nav-main'
import { NavProjects } from '@/components/sidebar/nav-projects'
import { NavUser } from '@/components/sidebar/nav-user'
import { TeamSwitcher } from '@/components/sidebar/team-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'

const data = {
  teams: [
    {
      name: 'LMS Management',
      logo: <GalleryVerticalEndIcon />,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: <AudioLinesIcon />,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: <TerminalIcon />,
      plan: 'Free',
    },
  ],
  navMain: [
    {
      title: 'Teaching',
      url: '/dashboard/classrooms',
      icon: <SchoolIcon />,
      isActive: true,
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard/classrooms',
        },
        {
          title: 'Classrooms',
          url: '/dashboard/classrooms/list',
        },
        {
          title: 'Students',
          url: '/dashboard/classrooms/students',
        },
        {
          title: 'Schedule',
          url: '/dashboard/classrooms/schedule',
        },
      ],
    },
  ],
  projects: [
    {
      name: 'Design Engineering',
      url: '/dashboard',
      icon: <FrameIcon />,
    },
    {
      name: 'Sales & Marketing',
      url: '/dashboard/users',
      icon: <PieChartIcon />,
    },
    {
      name: 'Travel',
      url: '/dashboard/courses',
      icon: <MapIcon />,
    },
    {
      name: 'User Management',
      url: '/dashboard/users',
      icon: <UsersIcon />,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavProjects projects={data.projects} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
