import { Link } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import {
  ChevronsUpDownIcon,
  LogOutIcon,
  SettingsIcon,
} from 'lucide-react'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  clearMyAccountProfileCache,
  getProfileDisplayName,
  getProfileInitials,
  useMyAccountProfile,
} from '@/features/account'
import { useAuth } from '@/features/auth'

export function NavUser() {
  const { isMobile } = useSidebar()
  const queryClient = useQueryClient()
  const { logout, status, isAuthenticated, session } = useAuth()
  const { data: profile, isPending: isProfilePending } = useMyAccountProfile(
    isAuthenticated,
  )

  const email = profile?.email ?? session?.user.email ?? 'Signed in'
  const displayName = profile
    ? getProfileDisplayName(profile)
    : email.includes('@')
      ? (email.split('@')[0] ?? email)
      : email
  const initials = profile
    ? getProfileInitials(profile)
    : displayName.slice(0, 2).toUpperCase()

  const isLoading = status === 'loading' || (isAuthenticated && isProfilePending)

  async function handleLogout() {
    clearMyAccountProfileCache(queryClient)
    await logout()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isLoading}
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{displayName}</span>
                <span className="truncate text-xs">{email}</span>
              </div>
              <ChevronsUpDownIcon className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{displayName}</span>
                  <span className="truncate text-xs">{email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/dashboard/settings">
                <SettingsIcon />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void handleLogout()}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
