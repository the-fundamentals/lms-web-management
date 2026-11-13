import { createFileRoute } from "@tanstack/react-router";
import { ClassroomSettingsShell } from "@/features/classroom/components/classroom-settings-shell";

export const Route = createFileRoute("/classrooms/$classroomId/settings")({
  component: ClassroomSettingsLayoutRoute,
});

function ClassroomSettingsLayoutRoute() {
  const { classroomId } = Route.useParams();
  return <ClassroomSettingsShell classroomId={classroomId} />;
}
