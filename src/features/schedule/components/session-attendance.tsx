import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CircleAlert, Pencil, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/shared/lib/cn";
import { requestFailedMessage, RequestStatus } from "@/shared/ui/request-status";
import { sessionTypeLabel } from "../lib/session-buckets";
import {
  completeSession,
  listActiveMembersForAttendance,
  saveAttendanceStatuses,
  sessionAttendancesQueryOptions,
  sessionQueryOptions,
  type AttendanceRow,
  type SessionRow,
} from "../lib/session-api";
import {
  formatSessionClockRange,
  formatSessionWhen,
  sessionDateParts,
} from "../lib/session-time";

type SessionAttendanceProps = {
  classroomId: string;
  sessionId: string;
};

type Mark = "ATTENDED" | "ABSENT" | "UNSET";

function markLabel(mark: Mark): string {
  if (mark === "ATTENDED") return "Present";
  if (mark === "ABSENT") return "Absent";
  return "—";
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[7.5rem_minmax(0,1fr)]">
      <dt className="type-secondary text-muted-foreground">{label}</dt>
      <dd className="min-w-0 type-body text-foreground">{children}</dd>
    </div>
  );
}

function SessionDetailsPanel({
  session,
  open,
}: {
  session: SessionRow;
  open: boolean;
}) {
  const dateParts = sessionDateParts(session.sessionDate);
  const clock = formatSessionClockRange(
    session.sessionDate,
    session.startTime,
    session.endTime,
  );
  const name = session.name?.trim();
  const description = session.description?.trim();

  // Hanging table — row rules only; status lives in the dialog title.
  return (
    <section className="space-y-1" data-testid="session-details">
      <div className="flex flex-wrap items-center gap-2 pb-1">
        <p className="type-secondary font-medium tracking-wide text-muted-foreground uppercase">
          Session details
        </p>
        {!open ? (
          <span className="type-secondary text-muted-foreground">
            Attendance locked
            <span className="sr-only" data-testid="session-not-open">
              This session is not open. Present and Absent cannot be changed.
            </span>
          </span>
        ) : null}
      </div>

      <dl className="divide-y divide-border/60 border-y border-border/60">
        <DetailRow label="When">
          {dateParts.label} · {clock}
        </DetailRow>
        <DetailRow label="Type">{sessionTypeLabel(session.type)}</DetailRow>
        <DetailRow label="Timezone">GMT+7</DetailRow>
        {name ? <DetailRow label="Name">{name}</DetailRow> : null}
        {description ? (
          <DetailRow label="Notes">
            <span className="whitespace-pre-wrap text-foreground/90">{description}</span>
          </DetailRow>
        ) : null}
      </dl>
    </section>
  );
}

/** Attendance roster + lifecycle — centered attendance dialog body. */
export function SessionAttendance({ classroomId, sessionId }: SessionAttendanceProps) {
  const sessionQuery = useQuery(sessionQueryOptions(classroomId, sessionId));
  const attendanceQuery = useQuery(sessionAttendancesQueryOptions(classroomId, sessionId));
  const membersQuery = useQuery({
    queryKey: ["schedule-members", classroomId],
    queryFn: () => listActiveMembersForAttendance(classroomId),
  });

  const [draft, setDraft] = useState<Record<string, Mark>>({});
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [lifecyclePending, setLifecyclePending] = useState(false);

  const session = sessionQuery.data;
  const open = session?.status === "OPEN";
  const existingByMember = useMemo(() => {
    const map = new Map<string, AttendanceRow>();
    for (const row of attendanceQuery.data ?? []) {
      map.set(row.classroomMemberId, row);
    }
    return map;
  }, [attendanceQuery.data]);

  function markFor(memberId: string): Mark {
    if (draft[memberId]) return draft[memberId]!;
    const existing = existingByMember.get(memberId);
    if (!existing || existing.status === "UNSET") return "UNSET";
    return existing.status;
  }

  function beginEdit() {
    if (!open) return;
    setEditing(true);
    setFailure(null);
  }

  function cancelEdit() {
    setDraft({});
    setEditing(false);
    setFailure(null);
  }

  async function saveMarks() {
    if (!open || saving || !editing) return;
    const marks = (membersQuery.data ?? [])
      .map((member) => {
        const status = markFor(member.id);
        if (status === "UNSET") return null;
        const existing = existingByMember.get(member.id);
        return {
          classroomMemberId: member.id,
          status,
          ...(existing ? { existingId: existing.id } : {}),
        };
      })
      .filter(Boolean) as Array<{
      classroomMemberId: string;
      status: "ATTENDED" | "ABSENT";
      existingId?: string;
    }>;
    setSaving(true);
    setFailure(null);
    try {
      await saveAttendanceStatuses(classroomId, sessionId, marks);
      setDraft({});
      setEditing(false);
      await attendanceQuery.refetch();
    } catch (error) {
      setFailure(error);
    } finally {
      setSaving(false);
    }
  }

  async function runComplete() {
    if (!session || lifecyclePending) return;
    setLifecyclePending(true);
    try {
      await completeSession(classroomId, sessionId);
      setConfirmComplete(false);
      setEditing(false);
      setDraft({});
      await sessionQuery.refetch();
    } finally {
      setLifecyclePending(false);
    }
  }

  const pending =
    sessionQuery.isPending || attendanceQuery.isPending || membersQuery.isPending;
  const error = sessionQuery.error || attendanceQuery.error || membersQuery.error;

  const sessionLabel =
    session?.name?.trim() ||
    (session
      ? formatSessionWhen(session.sessionDate, session.startTime, session.endTime)
      : "this session");

  const members = membersQuery.data ?? [];
  const markedCount = members.filter((m) => markFor(m.id) !== "UNSET").length;
  // Persisted marks only — draft edits aren't saved on complete.
  const unmarkedCount = members.filter((m) => {
    const existing = existingByMember.get(m.id);
    return !existing || existing.status === "UNSET";
  }).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col" data-testid="session-attendance">
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
        <RequestStatus
          error={error}
          onRetry={() => {
            void sessionQuery.refetch();
            void attendanceQuery.refetch();
            void membersQuery.refetch();
          }}
          status={pending ? "pending" : error ? "error" : "success"}
        >
          {session ? (
            <>
              <SessionDetailsPanel open={open} session={session} />

              <section
                className="overflow-hidden rounded-xl border border-border/70"
                data-testid="attendance-section"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 bg-muted/15 px-4 py-2.5">
                  <p className="type-body text-foreground">
                    <span className="type-secondary font-medium tracking-wide text-muted-foreground uppercase">
                      Attendance
                    </span>
                    {members.length > 0 ? (
                      <span className="ml-2 type-secondary font-normal normal-case tracking-normal text-muted-foreground">
                        {markedCount}/{members.length}
                      </span>
                    ) : null}
                  </p>
                  {open && !editing ? (
                    <Button
                      data-testid="attendance-edit"
                      onClick={beginEdit}
                      size="sm"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil aria-hidden />
                      Edit
                    </Button>
                  ) : null}
                  {open && editing ? (
                    <div className="flex flex-wrap gap-1">
                      <Button
                        data-testid="attendance-edit-cancel"
                        disabled={saving}
                        onClick={cancelEdit}
                        size="sm"
                        type="button"
                        variant="ghost"
                      >
                        <X aria-hidden />
                        Discard
                      </Button>
                      <Button
                        data-testid="attendance-save"
                        disabled={saving}
                        onClick={() => {
                          void saveMarks();
                        }}
                        size="sm"
                        type="button"
                      >
                        {saving ? "Saving…" : "Save"}
                      </Button>
                    </div>
                  ) : null}
                </div>

                {members.length === 0 ? (
                  <div className="px-4 py-8 text-center type-secondary text-muted-foreground">
                    No active members in this classroom.
                  </div>
                ) : (
                  <table className="w-full border-collapse text-left" data-testid="attendance-roster">
                    <thead className="sr-only">
                      <tr>
                        <th>Student</th>
                        <th>Mark</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((member, index) => {
                        const value = markFor(member.id);
                        return (
                          <tr
                            className={cn(index > 0 && "border-t border-border/60")}
                            data-testid={`attendance-row-${member.id}`}
                            key={member.id}
                          >
                            <td className="px-4 py-2.5 align-middle">
                              <span className="block type-body text-foreground">
                                {member.name}
                              </span>
                              <span className="block type-secondary text-muted-foreground">
                                {member.email}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 align-middle">
                              {editing && open ? (
                                <div className="flex flex-wrap justify-end gap-1.5">
                                  <Button
                                    data-testid={`attendance-present-${member.id}`}
                                    disabled={saving}
                                    onClick={() =>
                                      setDraft((d) => ({ ...d, [member.id]: "ATTENDED" }))
                                    }
                                    size="sm"
                                    type="button"
                                    variant={value === "ATTENDED" ? "default" : "outline"}
                                  >
                                    Present
                                  </Button>
                                  <Button
                                    data-testid={`attendance-absent-${member.id}`}
                                    disabled={saving}
                                    onClick={() =>
                                      setDraft((d) => ({ ...d, [member.id]: "ABSENT" }))
                                    }
                                    size="sm"
                                    type="button"
                                    variant={value === "ABSENT" ? "default" : "outline"}
                                  >
                                    Absent
                                  </Button>
                                </div>
                              ) : (
                                <span
                                  className={cn(
                                    "flex justify-end type-secondary font-medium",
                                    value === "ATTENDED" && "text-primary",
                                    value === "ABSENT" && "text-muted-foreground",
                                    value === "UNSET" && "text-muted-foreground/55",
                                  )}
                                  data-testid={`attendance-mark-${member.id}`}
                                >
                                  {markLabel(value)}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}

                {failure ? (
                  <div className="border-t border-border/60 px-4 py-3">
                    <Alert data-testid="attendance-error" variant="destructive">
                      <CircleAlert />
                      <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
                    </Alert>
                  </div>
                ) : null}
              </section>
            </>
          ) : null}
        </RequestStatus>
      </div>

      {session && open ? (
        <div className="mt-auto border-t border-border/80 bg-background px-6 py-4">
          <Button
            className="w-full"
            data-testid="session-complete"
            onClick={() => setConfirmComplete(true)}
            type="button"
          >
            Complete session
          </Button>
        </div>
      ) : null}

      <AlertDialog
        onOpenChange={(openDialog) => {
          if (!openDialog) setConfirmComplete(false);
        }}
        open={confirmComplete}
      >
        <AlertDialogContent data-testid="session-lifecycle-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete {sessionLabel}?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {unmarkedCount > 0 ? (
                  <p data-testid="session-complete-attendance-warning">
                    You haven&apos;t taken attendance for {unmarkedCount}{" "}
                    {unmarkedCount === 1 ? "student" : "students"}. Are you sure you want to
                    continue?
                  </p>
                ) : null}
                <p>This marks the session completed. Attendance can no longer change.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="session-lifecycle-dismiss" disabled={lifecyclePending}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="session-lifecycle-confirm"
              disabled={lifecyclePending}
              onClick={(event) => {
                event.preventDefault();
                void runComplete();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
