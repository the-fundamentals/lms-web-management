import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { SignInRoute } from "@/features/auth/components/sign-in-route";
import { signOut } from "@/features/auth/components/sign-out";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ClassroomLayout } from "@/features/classroom/components/classroom-layout";
import { classroomMembersQueryOptions } from "@/shared/api/classroom-members";
import { LoadingScreen } from "@/shared/ui/loading-screen";

export const Route = createFileRoute("/classrooms/$classroomId")({
  component: ClassroomLayoutRoute,
});

function ClassroomLayoutRoute() {
  const { classroomId } = Route.useParams();
  const auth = useAuth();
  const navigate = useNavigate();
  const [classroomTitle, setClassroomTitle] = useState<string | undefined>();
  const onTitleChange = useCallback((name: string | undefined) => {
    setClassroomTitle(name);
  }, []);

  // Warm the shared members cache alongside classroom details (L1: route composes;
  // classroom feature must not import members). Money / Members reuse this query.
  useQuery(classroomMembersQueryOptions(classroomId));

  if (auth.isLoading) {
    return <LoadingScreen hint="Connecting to your school account" label="Signing in" />;
  }
  if (!auth.isAuthenticated) return <SignInRoute />;

  return (
    <AppShell
      onSignOut={() => {
        void signOut().then((destination) => {
          void navigate({ to: destination as "/sign-in" });
        });
      }}
      title={classroomTitle ?? "Classroom"}
    >
      <ClassroomLayout classroomId={classroomId} onTitleChange={onTitleChange} />
    </AppShell>
  );
}
