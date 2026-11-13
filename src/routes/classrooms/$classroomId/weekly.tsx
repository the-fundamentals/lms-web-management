import { createFileRoute } from "@tanstack/react-router";
import { WeeklySchedule } from "@/features/schedule/components/weekly-schedule";

export const Route = createFileRoute("/classrooms/$classroomId/weekly")({
  component: ClassroomWeeklyRoute,
});

function ClassroomWeeklyRoute() {
  const { classroomId } = Route.useParams();
  return <WeeklySchedule classroomId={classroomId} />;
}
