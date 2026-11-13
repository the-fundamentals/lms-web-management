import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_ATTENDANCE_PAGE_SIZE, memberAttendancesQueryOptions } from "../lib/member-api";
import { RequestStatus } from "@/shared/ui/request-status";

type MemberAttendanceProps = {
  classroomId: string;
  memberId: string;
};

function formatAttendanceDate(value?: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
  }).format(date);
}

export function MemberAttendance({ classroomId, memberId }: MemberAttendanceProps) {
  const [page, setPage] = useState(0);
  const query = useQuery(memberAttendancesQueryOptions(classroomId, memberId, page));
  const rows = query.data ?? [];
  const maybeMore = rows.length >= DEFAULT_ATTENDANCE_PAGE_SIZE;

  return (
    <div className="flex flex-col gap-4" data-testid="member-attendance">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <p className="type-section text-foreground">Attendance history</p>
          <p className="type-secondary text-muted-foreground">
            Session records for this member.
          </p>
        </div>
        <Button asChild size="sm" variant="outline">
          <Link
            data-testid="member-attendance-back"
            params={{ classroomId }}
            to="/classrooms/$classroomId/members"
          >
            <ArrowLeft aria-hidden />
            Back to members
          </Link>
        </Button>
      </div>

      <RequestStatus
        error={query.error}
        onRetry={() => {
          void query.refetch();
        }}
        status={query.isPending ? "pending" : query.isError ? "error" : "success"}
      >
        {rows.length === 0 ? (
          <div
            className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-muted/30 p-5"
            data-testid="member-attendance-empty"
          >
            <span className="flex size-9 items-center justify-center rounded-full bg-background text-primary shadow-sm">
              <CalendarDays aria-hidden className="size-4" strokeWidth={1.75} />
            </span>
            <div className="flex flex-col gap-1">
              <p className="type-body text-foreground">No attendance yet</p>
              <p className="type-secondary text-muted-foreground">
                History appears after sessions are marked.
              </p>
            </div>
          </div>
        ) : (
          <>
            <ul className="flex flex-col gap-2" data-testid="member-attendance-list">
              {rows.map((row) => (
                <li
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3"
                  data-testid={`member-attendance-row-${row.id}`}
                  key={row.id}
                >
                  <div className="min-w-0">
                    <p className="type-body text-foreground">
                      {formatAttendanceDate(row.attendanceDate ?? row.createdDate)}
                    </p>
                    <p className="type-secondary text-muted-foreground">
                      Session {row.sessionId}
                    </p>
                  </div>
                  <Badge variant="outline">{row.status}</Badge>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between gap-2">
              <Button
                data-testid="member-attendance-prev"
                disabled={page === 0 || query.isFetching}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                size="sm"
                type="button"
                variant="outline"
              >
                <ChevronLeft aria-hidden />
                Previous
              </Button>
              <span className="type-secondary text-muted-foreground" data-testid="member-attendance-page">
                Page {page + 1}
              </span>
              <Button
                data-testid="member-attendance-next"
                disabled={!maybeMore || query.isFetching}
                onClick={() => setPage((p) => p + 1)}
                size="sm"
                type="button"
                variant="outline"
              >
                Next
                <ChevronRight aria-hidden />
              </Button>
            </div>
          </>
        )}
      </RequestStatus>
    </div>
  );
}
