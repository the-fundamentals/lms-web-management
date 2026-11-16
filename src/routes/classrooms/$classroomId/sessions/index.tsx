import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/classrooms/$classroomId/sessions/")({
  component: ClassroomSessionsRoute,
});

/** Overview lives in the sessions layout so it survives attendance navigation. */
function ClassroomSessionsRoute() {
  return null;
}
