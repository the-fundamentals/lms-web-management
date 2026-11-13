import { createFileRoute } from "@tanstack/react-router";
import { SessionCalendar } from "@/features/schedule/components/session-calendar";

export const Route = createFileRoute("/classrooms/$classroomId/calendar")({
  component: ClassroomCalendarRoute,
});

function ClassroomCalendarRoute() {
  const { classroomId } = Route.useParams();
  return <SessionCalendar classroomId={classroomId} />;
}
