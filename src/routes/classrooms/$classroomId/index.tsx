import { createFileRoute } from "@tanstack/react-router";

/**
 * Classroom root — Overview tab content lives in ClassroomLayout.
 * Sessions live at `/classrooms/$classroomId/sessions`.
 */
export const Route = createFileRoute("/classrooms/$classroomId/")({
  component: ClassroomIndexRoute,
});

function ClassroomIndexRoute() {
  return null;
}
