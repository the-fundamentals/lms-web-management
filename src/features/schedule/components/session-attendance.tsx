import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ban, CircleAlert, Lock, MoreHorizontal, Pencil } from "lucide-react";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/cn";
import { publicAssetUrl } from "@/shared/lib/public-asset-url";
import { requestFailedMessage, RequestStatus } from "@/shared/ui/request-status";
import {
  completeSession,
  listActiveMembersForAttendance,
  saveAttendanceStatuses,
  sessionAttendancesQueryOptions,
  sessionQueryOptions,
  updateSession,
  type AttendanceRow,
  type SessionRow,
} from "../lib/session-api";
import { formatSessionWhen } from "../lib/session-time";

type SessionAttendanceProps = {
  classroomId: string;
  sessionId: string;
  /** Opens the sheet’s cancel-session confirm (⋯ next to Complete). */
  onRequestCancel?: () => void;
};

type Mark = "ATTENDED" | "ABSENT" | "UNSET";

function initials(name: string, email: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0]![0]}${parts[1]![0]}`.toUpperCase();
  if (parts.length === 1 && parts[0]!.length > 0) return parts[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}

/** Left-column context: notes (+ locked badge). Facts live in the modal header. */
function SessionNotesPanel({
  classroomId,
  session,
  open,
  onUpdated,
}: {
  classroomId: string;
  session: SessionRow;
  open: boolean;
  onUpdated: () => void;
}) {
  const persistedName = session.name?.trim() ?? "";
  const persistedNotes = session.description?.trim() ?? "";

  const [editingNotes, setEditingNotes] = useState(false);
  const [notesDraft, setNotesDraft] = useState(persistedNotes);
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesFailure, setNotesFailure] = useState<unknown>(null);

  useEffect(() => {
    if (!editingNotes) setNotesDraft(persistedNotes);
  }, [editingNotes, persistedNotes]);

  async function saveNotes() {
    if (notesSaving) return;
    setNotesSaving(true);
    setNotesFailure(null);
    try {
      const next = notesDraft.trim();
      // Omit clears — keep name when saving notes.
      await updateSession(classroomId, session.id, {
        name: persistedName || null,
        description: next || null,
      });
      setEditingNotes(false);
      onUpdated();
    } catch (error) {
      setNotesFailure(error);
    } finally {
      setNotesSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4" data-testid="session-details">
      {!open ? (
        <Badge
          className="w-fit gap-1 px-2 py-0.5 font-medium text-muted-foreground"
          data-testid="session-not-open"
          title="This session is not open. Present and Absent cannot be changed."
          variant="secondary"
        >
          <Lock aria-hidden className="size-3" />
          Attendance locked
        </Badge>
      ) : null}

      <section className="flex flex-col gap-2" data-testid="session-notes-block">
        <div className="flex items-center justify-between gap-2">
          <p className="type-secondary font-medium tracking-wide text-muted-foreground uppercase">
            Session notes
          </p>
          {open && !editingNotes ? (
            <Button
              className="-mr-1.5 h-7 px-2"
              data-testid="session-edit-notes"
              onClick={() => {
                setNotesDraft(persistedNotes);
                setEditingNotes(true);
                setNotesFailure(null);
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </Button>
          ) : null}
        </div>
        {editingNotes && open ? (
          <div className="flex flex-col gap-2">
            <Label className="sr-only" htmlFor={`session-notes-${session.id}`}>
              Session notes
            </Label>
            <textarea
              className={cn(
                "min-h-28 w-full resize-y rounded-md border border-input bg-transparent px-3 py-2 type-body shadow-xs outline-none",
                "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
                "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
              )}
              data-testid="session-notes-input"
              disabled={notesSaving}
              id={`session-notes-${session.id}`}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Agenda, homework, or anything to remember about this session…"
              value={notesDraft}
            />
            <div className="flex justify-end gap-1.5">
              <Button
                data-testid="session-notes-cancel"
                disabled={notesSaving}
                onClick={() => {
                  setEditingNotes(false);
                  setNotesDraft(persistedNotes);
                  setNotesFailure(null);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Cancel
              </Button>
              <Button
                data-testid="session-notes-save"
                disabled={notesSaving}
                onClick={() => void saveNotes()}
                size="sm"
                type="button"
              >
                {notesSaving ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <p
            className={cn(
              "whitespace-pre-wrap type-body leading-relaxed",
              persistedNotes ? "text-foreground/90" : "text-muted-foreground",
            )}
            data-testid="session-notes-display"
          >
            {persistedNotes || "No notes yet"}
          </p>
        )}

        {notesFailure ? (
          <Alert data-testid="session-meta-error" variant="destructive">
            <AlertDescription>{requestFailedMessage(notesFailure)}</AlertDescription>
          </Alert>
        ) : null}
      </section>
    </div>
  );
}

function persistedMark(
  existingByMember: Map<string, AttendanceRow>,
  memberId: string,
): Mark {
  const existing = existingByMember.get(memberId);
  if (!existing || existing.status === "UNSET") return "UNSET";
  return existing.status;
}

/** Left: notes + complete. Right: roster marks + Save. Header is owned by the sheet. */
export function SessionAttendance({
  classroomId,
  sessionId,
  onRequestCancel,
}: SessionAttendanceProps) {
  const sessionQuery = useQuery(sessionQueryOptions(classroomId, sessionId));
  const attendanceQuery = useQuery(sessionAttendancesQueryOptions(classroomId, sessionId));
  const membersQuery = useQuery({
    queryKey: ["schedule-members", classroomId],
    queryFn: () => listActiveMembersForAttendance(classroomId),
  });

  const [draft, setDraft] = useState<Record<string, Mark>>({});
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
    return persistedMark(existingByMember, memberId);
  }

  const dirty = Object.keys(draft).length > 0;

  async function saveMarks() {
    if (!open || saving || !dirty) return;
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
  const presentCount = members.filter(
    (m) => persistedMark(existingByMember, m.id) === "ATTENDED",
  ).length;
  const absentCount = members.filter(
    (m) => persistedMark(existingByMember, m.id) === "ABSENT",
  ).length;
  const persistedMarkedCount = presentCount + absentCount;
  const canComplete = members.length === 0 || persistedMarkedCount > 0;
  const unmarkedCount = members.filter((m) => {
    const existing = existingByMember.get(m.id);
    return !existing || existing.status === "UNSET";
  }).length;

  return (
    <div
      className="flex min-h-0 flex-1 flex-row overflow-hidden"
      data-testid="session-attendance"
    >
      <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden border-r border-border/80 bg-background">
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
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
              <SessionNotesPanel
                classroomId={classroomId}
                onUpdated={() => {
                  void sessionQuery.refetch();
                }}
                open={open}
                session={session}
              />
            ) : null}
          </RequestStatus>
        </div>

        {session && open ? (
          <div className="shrink-0 border-t border-border/80 px-5 py-3.5">
            <div className="flex items-center gap-2">
              {onRequestCancel ? (
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      aria-label="More session actions"
                      data-testid="session-actions-menu"
                      size="icon"
                      type="button"
                      variant="outline"
                    >
                      <MoreHorizontal aria-hidden className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" side="top">
                    <DropdownMenuItem
                      data-testid="session-cancel"
                      onSelect={onRequestCancel}
                      variant="destructive"
                    >
                      <Ban aria-hidden />
                      Cancel session
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
              <Button
                className="min-w-0 flex-1"
                data-testid="session-complete"
                disabled={!canComplete}
                onClick={() => setConfirmComplete(true)}
                type="button"
                variant={canComplete ? "default" : "secondary"}
              >
                Complete session
              </Button>
            </div>
            {!canComplete ? (
              <p
                className="mt-2 text-center type-secondary text-muted-foreground"
                data-testid="session-complete-hint"
              >
                Take attendance for at least one student first.
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <aside
        className="relative flex h-full min-h-0 w-[min(100%,22rem)] shrink-0 flex-col overflow-hidden bg-muted"
        data-testid="attendance-roster-panel"
      >
        <div className="flex shrink-0 flex-col gap-0.5 border-b border-border/60 px-4 py-3">
          <div className="flex items-baseline justify-between gap-2">
            <p className="type-secondary font-medium tracking-wide text-muted-foreground uppercase">
              Attendance
            </p>
            <p className="type-secondary text-muted-foreground">
              {members.length} {members.length === 1 ? "student" : "students"}
            </p>
          </div>
          <p
            className="type-secondary text-muted-foreground"
            data-testid="attendance-summary"
          >
            {members.length === 0 ? (
              "No students yet"
            ) : (
              <>
                <span className="tabular-nums text-primary">{presentCount} Present</span>
                <span className="mx-1.5 text-muted-foreground/40">·</span>
                <span className="tabular-nums">{absentCount} Absent</span>
                {members.length - persistedMarkedCount > 0 ? (
                  <>
                    <span className="mx-1.5 text-muted-foreground/40">·</span>
                    <span className="tabular-nums text-muted-foreground/70">
                      {members.length - persistedMarkedCount} unset
                    </span>
                  </>
                ) : null}
              </>
            )}
          </p>
        </div>

        <div className="relative min-h-0 flex-1">
          <div
            className={cn(
              "h-full overflow-y-auto overscroll-contain",
              open && dirty && "pb-20",
            )}
          >
            {members.length === 0 ? (
              <div className="px-4 py-8 text-center type-secondary text-muted-foreground">
                {pending ? "Loading students…" : "No active members in this classroom."}
              </div>
            ) : (
              <ul className="divide-y divide-border/30" data-testid="attendance-roster">
                {members.map((member) => {
                  const value = markFor(member.id);
                  const src = publicAssetUrl(member.avatar);
                  return (
                    <li
                      className="flex items-center gap-2.5 px-3 py-1.5"
                      data-testid={`attendance-row-${member.id}`}
                      key={member.id}
                    >
                      <Avatar className="size-7 shrink-0">
                        {src ? <AvatarImage alt="" src={src} /> : null}
                        <AvatarFallback className="text-[0.65rem]">
                          {initials(member.name, member.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate type-body leading-tight text-foreground">
                          {member.name}
                        </p>
                        <p className="truncate text-[0.6875rem] leading-tight text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                      {open ? (
                        <div
                          className="flex shrink-0 rounded-full bg-black/[0.04] p-0.5 ring-1 ring-border/40 dark:bg-white/10"
                          role="group"
                        >
                          <button
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                              value === "ATTENDED"
                                ? "bg-primary text-primary-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            data-testid={`attendance-present-${member.id}`}
                            disabled={saving}
                            onClick={() =>
                              setDraft((d) => ({ ...d, [member.id]: "ATTENDED" }))
                            }
                            type="button"
                          >
                            Present
                          </button>
                          <button
                            className={cn(
                              "rounded-full px-2.5 py-1 text-xs font-medium transition-colors",
                              value === "ABSENT"
                                ? "bg-foreground/80 text-background shadow-sm"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                            data-testid={`attendance-absent-${member.id}`}
                            disabled={saving}
                            onClick={() =>
                              setDraft((d) => ({ ...d, [member.id]: "ABSENT" }))
                            }
                            type="button"
                          >
                            Absent
                          </button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "shrink-0 type-secondary font-medium",
                            value === "ATTENDED" && "text-primary",
                            value === "ABSENT" && "text-muted-foreground",
                            value === "UNSET" && "text-muted-foreground/55",
                          )}
                          data-testid={`attendance-mark-${member.id}`}
                        >
                          {value === "ATTENDED"
                            ? "Present"
                            : value === "ABSENT"
                              ? "Absent"
                              : "—"}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {failure ? (
            <div className="shrink-0 border-t border-border/40 px-4 py-3">
              <Alert data-testid="attendance-error" variant="destructive">
                <CircleAlert />
                <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
              </Alert>
            </div>
          ) : null}

          {open && dirty ? (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-4">
              <Button
                className={cn(
                  "pointer-events-auto h-11 min-w-[10rem] rounded-full px-8 shadow-lg",
                  "animate-in fade-in-0 slide-in-from-bottom-3 duration-300",
                )}
                data-testid="attendance-save"
                disabled={saving}
                onClick={() => {
                  void saveMarks();
                }}
                type="button"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
            </div>
          ) : null}
        </div>
      </aside>

      <AlertDialog
        onOpenChange={(openDialog) => {
          if (!openDialog) setConfirmComplete(false);
        }}
        open={confirmComplete}
      >
        <AlertDialogContent data-testid="session-complete-dialog">
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
            <AlertDialogCancel data-testid="session-complete-dismiss" disabled={lifecyclePending}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="session-complete-confirm"
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
