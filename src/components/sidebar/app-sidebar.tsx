import {
  AudioLinesIcon,
  BookOpenIcon,
  BotIcon,
  FrameIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  MapIcon,
  PieChartIcon,
  Settings2Icon,
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
  user: {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: '',
  },
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
      title: 'Overview',
      url: '/dashboard',
      icon: <LayoutDashboardIcon />,
      isActive: true,
      items: [
        {
          title: 'Dashboard',
          url: '/dashboard',
        },
        {
          title: 'Users',
          url: '/dashboard/users',
        },
        {
          title: 'Courses',
          url: '/dashboard/courses',
        },
      ],
    },
    {
      title: 'Models',
      url: '#',
      icon: <BotIcon />,
      items: [
        {
          title: 'Genesis',
          url: '/dashboard',
        },
        {
          title: 'Explorer',
          url: '/dashboard',
        },
        {
          title: 'Quantum',
          url: '/dashboard',
        },
      ],
    },
    {
      title: 'Documentation',
      url: '#',
      icon: <BookOpenIcon />,
      items: [
        {
          title: 'Introduction',
          url: '/dashboard',
        },
        {
          title: 'Get Started',
          url: '/dashboard',
        },
        {
          title: 'Tutorials',
          url: '/dashboard',
        },
        {
          title: 'Changelog',
          url: '/dashboard',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/dashboard/settings',
      icon: <Settings2Icon />,
      items: [
        {
          title: 'General',
          url: '/dashboard/settings',
        },
        {
          title: 'Team',
          url: '/dashboard/settings',
        },
        {
          title: 'Billing',
          url: '/dashboard/settings',
        },
        {
          title: 'Limits',
          url: '/dashboard/settings',
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
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
