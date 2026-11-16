import { Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { SessionOverview } from "@/features/schedule/components/session-overview";

export const Route = createFileRoute("/classrooms/$classroomId/sessions")({
  component: ClassroomSessionsLayoutRoute,
});

/**
 * Keep SessionOverview mounted across index ↔ attendance so opening a session
 * does not remount the calendar (that remount was the open-modal jank).
 * /sessions/new is a full-page form — skip the overview there.
 */
function ClassroomSessionsLayoutRoute() {
  const { classroomId } = Route.useParams();
  const isCreatePage = useRouterState({
    select: (s) => s.location.pathname.endsWith("/sessions/new"),
  });

  return (
    <>
      {isCreatePage ? null : <SessionOverview classroomId={classroomId} />}
      <Outlet />
    </>
  );
}
