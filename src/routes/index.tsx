import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { SignInRoute } from "@/features/auth/components/sign-in-route";
import { signOut } from "@/features/auth/components/sign-out";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { OverviewDashboard } from "@/features/app-shell/components/overview-dashboard";
import { classroomsQueryOptions } from "@/features/classroom/lib/classroom-api";
import { LoadingScreen } from "@/shared/ui/loading-screen";
import { RequestStatus } from "@/shared/ui/request-status";

// Overview owns `/` with live classroom counts. Full list is `/classrooms`.
function HomePage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const classroomsQuery = useQuery({
    ...classroomsQueryOptions(),
    enabled: auth.isAuthenticated,
  });

  if (auth.isLoading) {
    return <LoadingScreen hint="Connecting to your school account" label="Signing in" />;
  }
  if (!auth.isAuthenticated) return <SignInRoute />;

  const classrooms = classroomsQuery.data ?? [];
  const stats = {
    classroomCount: classrooms.length,
    memberTotal: classrooms.reduce((sum, row) => sum + row.numberOfMembers, 0),
  };

  return (
    <AppShell
      onSignOut={() => {
        void signOut().then((destination) => {
          void navigate({ to: destination as "/sign-in" });
        });
      }}
      title="Overview"
    >
      <RequestStatus
        error={classroomsQuery.error}
        onRetry={() => {
          void classroomsQuery.refetch();
        }}
        status={
          classroomsQuery.isPending ? "pending" : classroomsQuery.isError ? "error" : "success"
        }
        title="Couldn't load classrooms"
      >
        <OverviewDashboard stats={stats} />
      </RequestStatus>
    </AppShell>
  );
}

export const Route = createFileRoute("/")({
  component: HomePage,
});
