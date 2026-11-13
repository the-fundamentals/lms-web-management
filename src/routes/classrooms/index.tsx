import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAuth } from "react-oidc-context";
import { SignInRoute } from "@/features/auth/components/sign-in-route";
import { signOut } from "@/features/auth/components/sign-out";
import { AppShell } from "@/features/app-shell/components/app-shell";
import { ClassroomList } from "@/features/classroom/components/classroom-list";
import { LoadingScreen } from "@/shared/ui/loading-screen";

function ClassroomsPage() {
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
      title="Classrooms"
    >
      <ClassroomList />
    </AppShell>
  );
}

export const Route = createFileRoute("/classrooms/")({
  component: ClassroomsPage,
});
