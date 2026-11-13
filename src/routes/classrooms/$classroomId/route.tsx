import { useCallback, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { SignInRoute } from "@/features/auth/components/sign-in-route";
import { signOut } from "@/features/auth/components/sign-out";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ClassroomLayout } from "@/features/classroom/components/classroom-layout";
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

  if (auth.isLoading) return <LoadingScreen />;
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
