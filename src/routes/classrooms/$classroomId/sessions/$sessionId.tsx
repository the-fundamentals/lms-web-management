import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SessionAttendanceSheet } from "@/features/schedule/components/session-attendance-sheet";
import { SessionOverview } from "@/features/schedule/components/session-overview";

export const Route = createFileRoute("/classrooms/$classroomId/sessions/$sessionId")({
  component: ClassroomSessionAttendanceRoute,
});

/** Match DialogContent `duration-200` close animation. */
const DIALOG_CLOSE_MS = 220;

function ClassroomSessionAttendanceRoute() {
  const { classroomId, sessionId } = Route.useParams();
  const navigate = useNavigate();
  // Local open — navigate after close so the zoom-out animation can finish.
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setOpen(true);
  }, [sessionId]);

  useEffect(() => {
    if (open) return;
    const timer = window.setTimeout(() => {
      void navigate({
        to: "/classrooms/$classroomId/sessions",
        params: { classroomId },
      });
    }, DIALOG_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [open, classroomId, navigate]);

  return (
    <>
      {/* Keep calendar/list under the modal — same Sessions tab surface. */}
      <SessionOverview classroomId={classroomId} />
      <SessionAttendanceSheet
        classroomId={classroomId}
        onOpenChange={setOpen}
        open={open}
        sessionId={sessionId}
      />
    </>
  );
}
