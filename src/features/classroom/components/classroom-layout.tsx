import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { BookOpen, CalendarDays, Users, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/shared/lib/cn";
import { publicAssetUrl } from "@/shared/lib/public-asset-url";
import { RequestStatus } from "@/shared/ui/request-status";
import { fetchClassroom, type ClassroomRow } from "../lib/classroom-api";
import {
  formatClassroomCreated,
  formatClassroomPlan,
  formatMemberCount,
} from "../lib/format-classroom";
import { ClassroomShell } from "./classroom-shell";

type ClassroomLayoutProps = {
  classroomId: string;
  /** When the name loads, tell the route so the header breadcrumb can use it. */
  onTitleChange?: (name: string | undefined) => void;
};

function ClassroomHero({ classroom }: { classroom: ClassroomRow }) {
  const src = publicAssetUrl(classroom.bannerKey);

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border",
        "ring-1 ring-primary/10",
        src ? "bg-muted" : "bg-gradient-to-br from-primary/20 via-muted to-background",
      )}
      data-testid="classroom-banner"
    >
      {src ? (
        <>
          {/* Soften busy banners so cover art never fights the title. */}
          <img
            alt=""
            className="absolute inset-0 size-full scale-105 object-cover blur-[2px]"
            src={src}
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/35"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/25 to-transparent"
          />
        </>
      ) : null}

      <div
        className={cn(
          "relative flex flex-col gap-5 p-5 sm:p-6",
          src ? "min-h-48 justify-end sm:min-h-56" : "min-h-0",
        )}
      >
        <div
          className={cn(
            "flex min-w-0 max-w-3xl items-start gap-3",
            src &&
              "rounded-2xl border border-border/60 bg-background/85 p-4 shadow-sm backdrop-blur-md sm:p-5",
          )}
        >
          {!src ? (
            <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-xl bg-background/80 text-primary shadow-sm">
              <BookOpen aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
          ) : null}
          <div className="flex min-w-0 flex-col gap-2">
            <h2 className="type-page text-balance text-foreground">{classroom.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{classroom.status}</Badge>
              <span className="inline-flex items-center gap-1.5 type-secondary text-muted-foreground">
                <Users aria-hidden className="size-3.5" />
                {formatMemberCount(classroom.numberOfMembers)}
              </span>
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 type-secondary text-muted-foreground">
                <Wallet aria-hidden className="size-3.5" />
                {formatClassroomPlan(classroom)}
              </span>
              <span className="text-muted-foreground/40" aria-hidden>
                ·
              </span>
              <span className="inline-flex items-center gap-1.5 type-secondary text-muted-foreground">
                <CalendarDays aria-hidden className="size-3.5" />
                {formatClassroomCreated(classroom.createdDate)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ClassroomOverview({ classroom }: { classroom: ClassroomRow }) {
  return (
    <div className="flex flex-col gap-4" data-testid="classroom-overview">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="type-section text-foreground">Overview</p>
        <p className="type-secondary text-muted-foreground">
          Snapshot of this classroom. Rename and pricing live under Settings.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
          <dt className="type-secondary text-muted-foreground">Status</dt>
          <dd className="mt-1 type-body text-foreground">{classroom.status}</dd>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
          <dt className="type-secondary text-muted-foreground">Members</dt>
          <dd className="mt-1 type-body text-foreground">
            {formatMemberCount(classroom.numberOfMembers)}
          </dd>
        </div>
        <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
          <dt className="type-secondary text-muted-foreground">Plan</dt>
          <dd className="mt-1 type-body text-foreground">{formatClassroomPlan(classroom)}</dd>
        </div>
      </dl>
    </div>
  );
}

type ClassroomTab = "overview" | "sessions" | "members" | "money" | "settings";

export function ClassroomLayout({ classroomId, onTitleChange }: ClassroomLayoutProps) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const onMembersPath = pathname.includes("/members");
  const onMoneyPath = pathname.includes("/money");
  const onSettingsPath = pathname.includes("/settings");
  // Sessions tab URL + calendar / weekly / session detail / compose.
  const onSessionsPath = /\/(calendar|weekly|sessions)(\/|$)/.test(pathname);
  const [tab, setTab] = useState<ClassroomTab>(
    onSettingsPath
      ? "settings"
      : onMoneyPath
        ? "money"
        : onMembersPath
          ? "members"
          : onSessionsPath
            ? "sessions"
            : "overview",
  );
  const [override, setOverride] = useState<ClassroomRow | null>(null);
  const query = useQuery({
    queryKey: ["classroom", classroomId],
    queryFn: () => fetchClassroom(classroomId),
  });

  const classroom = override?.id === classroomId ? override : query.data;

  useEffect(() => {
    onTitleChange?.(classroom?.name);
    return () => onTitleChange?.(undefined);
  }, [classroom?.name, onTitleChange]);

  // URL wins — Overview = classroom root; Sessions / Members / Money / Settings.
  useEffect(() => {
    if (onSettingsPath) setTab("settings");
    else if (onMoneyPath) setTab("money");
    else if (onMembersPath) setTab("members");
    else if (onSessionsPath) setTab("sessions");
    else setTab("overview");
  }, [onMembersPath, onMoneyPath, onSessionsPath, onSettingsPath]);

  function goOverview() {
    setTab("overview");
    void navigate({
      to: "/classrooms/$classroomId",
      params: { classroomId },
    });
  }

  function goSessions() {
    setTab("sessions");
    void navigate({
      to: "/classrooms/$classroomId/sessions",
      params: { classroomId },
    });
  }

  function goMembers() {
    setTab("members");
    void navigate({
      to: "/classrooms/$classroomId/members",
      params: { classroomId },
    });
  }

  function goMoney() {
    setTab("money");
    void navigate({
      to: "/classrooms/$classroomId/money/invoices",
      params: { classroomId },
    });
  }

  function goSettings() {
    setTab("settings");
    void navigate({
      to: "/classrooms/$classroomId/settings",
      params: { classroomId },
    });
  }

  return (
    <RequestStatus
      error={query.error}
      onRetry={() => {
        void query.refetch();
      }}
      status={query.isPending ? "pending" : query.isError ? "error" : "success"}
    >
      {classroom ? (
        <ClassroomShell
          hero={
            // Back to list lives in the sidebar (`sidebar-classrooms`) — keep hero free of chrome.
            <ClassroomHero classroom={classroom} />
          }
        >
          {/*
            Overview stays local. Sessions + Members share <Outlet /> via routes —
            classroom must not import the members feature (L1 boundary).
          */}
          <Tabs
            className="gap-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm ring-1 ring-primary/5"
            onValueChange={(value) => {
              if (value === "overview") goOverview();
              else if (value === "sessions") goSessions();
              else if (value === "members") goMembers();
              else if (value === "money") goMoney();
              else if (value === "settings") goSettings();
            }}
            value={tab}
          >
            <div className="border-b border-border px-1 pt-1">
              <TabsList
                className="h-auto w-full justify-start gap-0 bg-transparent p-0"
                data-testid="classroom-tabs"
                variant="line"
              >
                <TabsTrigger
                  data-testid="classroom-tab-overview"
                  onClick={() => goOverview()}
                  value="overview"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  data-testid="classroom-tab-sessions"
                  onClick={() => goSessions()}
                  value="sessions"
                >
                  Sessions
                </TabsTrigger>
                <TabsTrigger
                  data-testid="classroom-tab-members"
                  onClick={() => goMembers()}
                  value="members"
                >
                  Members
                </TabsTrigger>
                <TabsTrigger
                  disabled
                  title="Attendance comes in a later unit"
                  value="attendance"
                >
                  Attendance
                </TabsTrigger>
                <TabsTrigger
                  data-testid="classroom-tab-money"
                  onClick={() => goMoney()}
                  value="money"
                >
                  Money
                </TabsTrigger>
                <TabsTrigger
                  data-testid="classroom-tab-settings"
                  onClick={() => goSettings()}
                  value="settings"
                >
                  Settings
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent
              className="mt-0 p-5 outline-none"
              forceMount
              hidden={tab !== "overview"}
              value="overview"
            >
              <ClassroomOverview classroom={classroom} />
            </TabsContent>

            {/*
              One <Outlet /> — Sessions / Members / Money / Settings child routes.
            */}
            <TabsContent
              className="mt-0 p-5 outline-none"
              forceMount
              hidden={
                tab !== "sessions" &&
                tab !== "members" &&
                tab !== "money" &&
                tab !== "settings"
              }
              value="sessions"
            >
              <div
                data-testid={
                  tab === "settings"
                    ? "classroom-settings-outlet"
                    : tab === "money"
                      ? "classroom-money-outlet"
                      : tab === "members"
                        ? "classroom-members-outlet"
                        : "classroom-outlet"
                }
              >
                <Outlet />
              </div>
            </TabsContent>
            <TabsContent className="hidden" forceMount hidden value="members" />
            <TabsContent className="hidden" forceMount hidden value="money" />
            <TabsContent className="hidden" forceMount hidden value="settings" />
          </Tabs>
        </ClassroomShell>
      ) : null}
    </RequestStatus>
  );
}

