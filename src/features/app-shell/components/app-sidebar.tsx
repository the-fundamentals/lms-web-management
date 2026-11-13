import { Link, useRouterState } from "@tanstack/react-router";
import { BookOpen, LayoutDashboard, Plus } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { BrandMark } from "./brand-mark";
import { NavUser, type AppShellUser } from "./nav-user";

export type { AppShellUser };

type AppSidebarProps = {
  onSignOut: () => void;
  user: AppShellUser;
};

export function AppSidebar({ onSignOut, user }: AppSidebarProps) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const onOverview = pathname === "/";
  const onClassrooms = pathname === "/classrooms" || pathname.startsWith("/classrooms/");

  return (
    <Sidebar collapsible="none" data-testid="app-sidebar">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="h-auto items-start py-2.5 [&>span:last-child]:!overflow-visible [&>span:last-child]:!whitespace-normal [&>span:last-child]:!text-clip"
              size="lg"
            >
              <Link to="/">
                <BrandMark />
                <span className="grid min-w-0 flex-1 gap-0.5 text-left leading-tight">
                  <span className="font-semibold text-balance">The Fundamentals</span>
                  <span className="text-xs font-normal text-muted-foreground">Management</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent className="flex flex-col gap-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  asChild
                  className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
                  data-testid="sidebar-new-classroom"
                >
                  <Link to="/classrooms/new">
                    <Plus aria-hidden />
                    <span>New classroom</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={onOverview}>
                  <Link data-testid="sidebar-overview" to="/">
                    <LayoutDashboard aria-hidden />
                    <span>Overview</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={onClassrooms}>
                  <Link data-testid="sidebar-classrooms" to="/classrooms">
                    <BookOpen aria-hidden />
                    <span>Classrooms</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser onSignOut={onSignOut} user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
