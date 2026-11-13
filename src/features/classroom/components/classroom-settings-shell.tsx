import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import { Tag, Wallet } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type ClassroomSettingsShellProps = {
  classroomId: string;
};

const nav = [
  {
    id: "general",
    label: "General",
    description: "Name",
    icon: Tag,
    to: "/classrooms/$classroomId/settings" as const,
    match: (path: string) =>
      path.endsWith("/settings") || path.endsWith("/settings/"),
  },
  {
    id: "pricing",
    label: "Pricing",
    description: "Rates",
    icon: Wallet,
    to: "/classrooms/$classroomId/settings/pricing" as const,
    match: (path: string) => path.includes("/settings/pricing"),
  },
];

/**
 * Windows-style settings: left nav + main pane.
 * L1: links by URL only — pricing UI lives in payment via the outlet route.
 */
export function ClassroomSettingsShell({ classroomId }: ClassroomSettingsShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="flex flex-col gap-5" data-testid="classroom-settings">
      <header className="flex flex-col gap-1">
        <p className="type-section text-foreground">Settings</p>
        <p className="type-secondary text-muted-foreground">
          Classroom configuration — name, pricing, and other setup.
        </p>
      </header>

      <div className="flex min-h-64 flex-col gap-5 sm:flex-row sm:gap-8">
        <nav
          aria-label="Settings sections"
          className="flex shrink-0 gap-1 overflow-x-auto sm:w-44 sm:flex-col sm:gap-0.5"
          data-testid="settings-nav"
        >
          {nav.map((item) => {
            const active = item.match(pathname);
            const Icon = item.icon;
            return (
              <Link
                className={cn(
                  "flex min-w-fit items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                  active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
                data-testid={`settings-nav-${item.id}`}
                key={item.id}
                params={{ classroomId }}
                to={item.to}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-md",
                    active ? "bg-primary/10 text-primary" : "bg-muted/80 text-muted-foreground",
                  )}
                >
                  <Icon aria-hidden className="size-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{item.label}</span>
                  <span className="hidden type-secondary text-muted-foreground sm:block">
                    {item.description}
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="min-w-0 flex-1" data-testid="settings-pane">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
