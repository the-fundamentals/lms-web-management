import { createFileRoute } from "@tanstack/react-router";
import { MemberAttendance } from "@/features/members/components/member-attendance";

export const Route = createFileRoute("/classrooms/$classroomId/members/$memberId")({
  component: ClassroomMemberAttendanceRoute,
});

function ClassroomMemberAttendanceRoute() {
  const { classroomId, memberId } = Route.useParams();
  return <MemberAttendance classroomId={classroomId} memberId={memberId} />;
}
