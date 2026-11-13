import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { ClassroomSettings } from "@/features/classroom/components/classroom-settings";
import { fetchClassroom } from "@/features/classroom/lib/classroom-api";
import { RequestStatus } from "@/shared/ui/request-status";

export const Route = createFileRoute("/classrooms/$classroomId/settings/")({
  component: ClassroomSettingsPage,
});

function ClassroomSettingsPage() {
  const { classroomId } = Route.useParams();
  const query = useQuery({
    queryKey: ["classroom", classroomId],
    queryFn: () => fetchClassroom(classroomId),
  });

  return (
    <RequestStatus
      error={query.error}
      onRetry={() => {
        void query.refetch();
      }}
      status={query.isPending ? "pending" : query.isError ? "error" : "success"}
    >
      {query.data ? (
        <ClassroomSettings
          classroom={query.data}
          onRenamed={() => {
            void query.refetch();
          }}
        />
      ) : null}
    </RequestStatus>
  );
}
