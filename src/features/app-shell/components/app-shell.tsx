import { useQuery } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { ErrorScreen } from "@/shared/ui/error-screen";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { requestFailedMessage } from "@/shared/ui/request-status";
import { shellProfileQueryOptions } from "../lib/shell-profile";
import { AppHeader } from "./app-header";
import { AppSidebar, type AppShellUser } from "./app-sidebar";

type AppShellProps = {
  children: ReactNode;
  onSignOut: () => void;
  /** Optional leaf breadcrumb override (e.g. classroom name). */
  title?: string;
  actions?: ReactNode;
  /** Test override — production loads GET /private/profile. */
  user?: AppShellUser;
};

/** Degraded footer when profile fetch fails — keeps nav usable. */
const PROFILE_UNAVAILABLE: AppShellUser = {
  name: "Profile unavailable",
  email: "",
};

/**
 * Signed-in chrome: always-expanded sidebar + inset main.
 * Profile footer comes from GET /private/profile (name, email, avatarKey URL).
 * Profile failure stays in the main pane — does not tear down sidebar/routes.
 */
export function AppShell({ children, onSignOut, title, actions, user }: AppShellProps) {
  const profileQuery = useQuery({
    ...shellProfileQueryOptions(),
    enabled: !user,
  });

  if (!user && profileQuery.isPending) {
    return <LoadingScreen hint="Opening your workspace" label="Loading" />;
  }

  const profileFailed = !user && profileQuery.isError;
  const resolved = user ?? profileQuery.data ?? (profileFailed ? PROFILE_UNAVAILABLE : undefined);

  if (!resolved) {
    return <LoadingScreen hint="Opening your workspace" label="Loading" />;
  }

  return (
    <SidebarProvider
      // h-svh + overflow-hidden pins the sidebar; only SidebarInset scrolls.
      className="h-svh overflow-hidden bg-background"
      defaultOpen
      style={{ "--header-height": "3.5rem" } as CSSProperties}
    >
      <AppSidebar onSignOut={onSignOut} user={resolved} />
      <SidebarInset className="min-h-0 overflow-hidden">
        <AppHeader actions={actions} title={title} />
        {/* Header stays put; only this pane scrolls. */}
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4 md:gap-6 md:p-6">
          {profileFailed ? (
            <ErrorScreen
              message={requestFailedMessage(profileQuery.error)}
              onRetry={() => {
                void profileQuery.refetch();
              }}
              title="Couldn't load your profile"
              variant="section"
            />
          ) : (
            children
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
