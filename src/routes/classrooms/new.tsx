import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { SignInRoute } from "@/features/auth/components/sign-in-route";
import { signOut } from "@/features/auth/components/sign-out";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ClassroomCreate } from "@/features/classroom/components/classroom-create";
import { LoadingScreen } from "@/shared/ui/loading-screen";

function NewClassroomPage() {
  const auth = useAuth();
  const navigate = useNavigate();

  if (auth.isLoading) return <LoadingScreen />;
  if (!auth.isAuthenticated) return <SignInRoute />;

  return (
    <AppShell
      onSignOut={() => {
        void signOut().then((destination) => {
          void navigate({ to: destination as "/sign-in" });
        });
      }}
      title="New classroom"
    >
      <ClassroomCreate />
    </AppShell>
  );
}

export const Route = createFileRoute("/classrooms/new")({
  component: NewClassroomPage,
});
