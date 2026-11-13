import { createFileRoute } from "@tanstack/react-router";
import { SessionCreate } from "@/features/schedule/components/session-create";

export const Route = createFileRoute("/classrooms/$classroomId/sessions/new")({
  component: ClassroomSessionNewRoute,
});

function ClassroomSessionNewRoute() {
  const { classroomId } = Route.useParams();
  return <SessionCreate classroomId={classroomId} />;
}
