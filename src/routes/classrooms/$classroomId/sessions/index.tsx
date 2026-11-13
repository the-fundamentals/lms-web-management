import { createFileRoute } from "@tanstack/react-router";
import { SessionOverview } from "@/features/schedule/components/session-overview";

export const Route = createFileRoute("/classrooms/$classroomId/sessions/")({
  component: ClassroomSessionsRoute,
});

function ClassroomSessionsRoute() {
  const { classroomId } = Route.useParams();
  return <SessionOverview classroomId={classroomId} />;
}
