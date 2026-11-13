import { createFileRoute } from "@tanstack/react-router";
import { MemberList } from "@/features/members/components/member-list";

export const Route = createFileRoute("/classrooms/$classroomId/members/")({
  component: ClassroomMembersRoute,
});

function ClassroomMembersRoute() {
  const { classroomId } = Route.useParams();
  return <MemberList classroomId={classroomId} />;
}
