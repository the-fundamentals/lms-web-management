import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type AppShellUser = {
  avatarUrl?: string;
  email: string;
  name: string;
};

type NavUserProps = {
  onSignOut: () => void;
  user: AppShellUser;
};

function initials(name: string, email: string): string {
  const source = name.trim() || email.trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

/**
 * Sidebar footer profile + sign-out.
 * Avatar uses the real public object URL when `avatarUrl` is set — never a fake image.
 * Plain img (not Radix AvatarImage) so the key URL is present without waiting on load.
 */
export function NavUser({ onSignOut, user }: NavUserProps) {
  const label = user.name.trim() || user.email.trim() || "Teacher";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div
          className="flex flex-col gap-2 rounded-lg border border-sidebar-border bg-sidebar p-2"
          data-testid="nav-user"
        >
          <div className="flex items-center gap-2 px-1" data-testid="nav-user-trigger">
            <Avatar className="size-8 rounded-lg">
              {user.avatarUrl ? (
                <img
                  alt=""
                  className="aspect-square size-full object-cover"
                  data-testid="nav-user-avatar"
                  src={user.avatarUrl}
                />
              ) : (
                <AvatarFallback className="rounded-lg">
                  {initials(user.name, user.email)}
                </AvatarFallback>
              )}
            </Avatar>
            <span className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-medium">{label}</span>
              {user.email ? (
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              ) : null}
            </span>
          </div>
          <Button
            className="w-full justify-start"
            data-testid="sign-out"
            onClick={onSignOut}
            type="button"
            variant="outline"
          >
            <LogOut aria-hidden />
            <span>Sign out</span>
          </Button>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
