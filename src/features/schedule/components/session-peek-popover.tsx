import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { classroomMembersQueryOptions } from "@/shared/api/classroom-members";
import { cn } from "@/shared/lib/cn";
import { requestFailedMessage } from "@/shared/ui/request-status";
import {
  sessionChipClass,
  sessionStatusBadgeClass,
  sessionStatusLabel,
  sessionTypeLabel,
} from "../lib/session-buckets";
import {
  sessionAttendancesQueryOptions,
  updateSession,
  type AttendanceRow,
  type SessionRow,
} from "../lib/session-api";
import {
  clockHm,
  formatSessionClockRange,
  sessionDateParts,
} from "../lib/session-time";
import { SessionCancelDialog } from "./session-cancel-dialog";

function attendanceMark(
  existingByMember: Map<string, AttendanceRow>,
  memberId: string,
): "ATTENDED" | "ABSENT" | "UNSET" {
  const existing = existingByMember.get(memberId);
  if (!existing || existing.status === "UNSET") return "UNSET";
  return existing.status;
}

function PeekAttendanceSummary({
  attended,
  absent,
  unknown,
  pending,
  /** When a title sits above, use a quiet rule — avoid a loud teal bar under the name. */
  separated,
}: {
  attended: number;
  absent: number;
  unknown: number;
  pending: boolean;
  separated?: boolean;
}) {
  if (pending) {
    return (
      <div
        aria-busy
        aria-label="Loading attendance"
        className={cn("pl-0.5", separated ? "mt-2.5 border-t border-border/50 pt-2.5" : "mt-2")}
        data-testid="session-peek-attendance-summary"
      >
        <div className="grid grid-cols-3 gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-5 w-6 animate-pulse rounded-sm bg-foreground/8" />
              <div className="h-2.5 w-10 animate-pulse rounded-sm bg-foreground/6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`${attended} attended, ${absent} absent, ${unknown} unknown`}
      className={cn("pl-0.5", separated ? "mt-2.5 border-t border-border/50 pt-2.5" : "mt-2")}
      data-testid="session-peek-attendance-summary"
    >
      <div className="grid grid-cols-3 gap-1">
        <div className="min-w-0">
          <p className="tabular-nums text-[1.05rem] font-semibold leading-none tracking-tight text-primary">
            {attended}
          </p>
          <p className="mt-1 text-[0.65rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            Attended
          </p>
        </div>
        <div className="min-w-0 border-l border-border/60 pl-2.5">
          <p className="tabular-nums text-[1.05rem] font-semibold leading-none tracking-tight text-destructive">
            {absent}
          </p>
          <p className="mt-1 text-[0.65rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            Absent
          </p>
        </div>
        <div className="min-w-0 border-l border-border/60 pl-2.5">
          <p className="tabular-nums text-[1.05rem] font-semibold leading-none tracking-tight text-foreground/55">
            {unknown}
          </p>
          <p className="mt-1 text-[0.65rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            Unknown
          </p>
        </div>
      </div>
    </div>
  );
}

type SessionPeekPopoverProps = {
  classroomId: string;
  session: SessionRow;
  /** Classes for the chip trigger (calendar cell entry). */
  className?: string;
  children: ReactNode;
};

function StatusGlyph({ status }: { status: SessionRow["status"] }) {
  if (status === "CANCELLED") {
    return <Ban aria-hidden className="size-3.5 shrink-0 opacity-90" />;
  }
  if (status === "COMPLETED") {
    return <CheckCircle2 aria-hidden className="size-3.5 shrink-0 opacity-90" />;
  }
  return null;
}

/** Calendar chip peek — actions follow status (open / completed / cancelled). */
export function SessionPeekPopover({
  classroomId,
  session,
  className,
  children,
}: SessionPeekPopoverProps) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);
  const [sessionDate, setSessionDate] = useState(session.sessionDate);
  const [startTime, setStartTime] = useState(clockHm(session.startTime));
  const [endTime, setEndTime] = useState(clockHm(session.endTime));
  const [name, setName] = useState(session.name ?? "");

  const scheduled = session.type === "SCHEDULE";
  const isOpen = session.status === "OPEN";
  const isCompleted = session.status === "COMPLETED";
  const isCancelled = session.status === "CANCELLED";
  /** ADHOC OPEN — date/time editable per updateClassroomSession. */
  const canEditAdhoc = isOpen && !scheduled;
  const showAttendanceSummary = !isCancelled;
  const displayName = session.name?.trim();
  const clock = formatSessionClockRange(
    session.sessionDate,
    session.startTime,
    session.endTime,
  );

  // Shared members cache (route-warmed) + session marks — same denominator as attendance modal.
  const membersQuery = useQuery({
    ...classroomMembersQueryOptions(classroomId),
    enabled: open && showAttendanceSummary,
  });
  const attendanceQuery = useQuery({
    ...sessionAttendancesQueryOptions(classroomId, session.id),
    enabled: open && showAttendanceSummary,
  });
  const attendanceCounts = useMemo(() => {
    const members = (membersQuery.data ?? []).filter((m) => m.status === "ACTIVE");
    const byMember = new Map<string, AttendanceRow>();
    for (const row of attendanceQuery.data ?? []) {
      byMember.set(row.classroomMemberId, row);
    }
    let attended = 0;
    let absent = 0;
    let unknown = 0;
    for (const member of members) {
      const mark = attendanceMark(byMember, member.id);
      if (mark === "ATTENDED") attended += 1;
      else if (mark === "ABSENT") absent += 1;
      else unknown += 1;
    }
    return { attended, absent, unknown };
  }, [attendanceQuery.data, membersQuery.data]);
  const attendanceSummaryPending =
    showAttendanceSummary &&
    (membersQuery.isPending || attendanceQuery.isPending);
  const date = sessionDateParts(session.sessionDate);

  useEffect(() => {
    if (!open) {
      setEditing(false);
      setFailure(null);
      setSessionDate(session.sessionDate);
      setStartTime(clockHm(session.startTime));
      setEndTime(clockHm(session.endTime));
      setName(session.name ?? "");
    }
  }, [open, session]);

  function openAttendance() {
    setOpen(false);
    void navigate({
      to: "/classrooms/$classroomId/sessions/$sessionId",
      params: { classroomId, sessionId: session.id },
    });
  }

  function openCancelDialog() {
    setOpen(false);
    setConfirmCancel(true);
  }

  async function saveEdits() {
    if (saving || !canEditAdhoc || !sessionDate) return;
    setSaving(true);
    setFailure(null);
    try {
      // Name/description omit = clear — always send both so we don't wipe description.
      await updateSession(classroomId, session.id, {
        sessionDate,
        startTime,
        endTime,
        name: name.trim() || null,
        description: session.description?.trim() ? session.description : null,
      });
      setEditing(false);
      setOpen(false);
    } catch (error) {
      setFailure(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger
          aria-label={`${clock}, ${sessionStatusLabel(session.status)}, ${sessionTypeLabel(session.type)}`}
          className={cn(
            "flex w-full items-center gap-1.5 truncate rounded-md px-1.5 py-1",
            "type-secondary leading-none transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            sessionChipClass(session.status, session.type),
            className,
          )}
          data-status={session.status}
          data-testid={`calendar-session-${session.id}`}
          type="button"
        >
          <StatusGlyph status={session.status} />
          {children}
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-72 overflow-hidden rounded-xl p-0 shadow-lg"
          data-testid={`session-peek-${session.id}`}
          // Dropdown portals outside the peek — don't dismiss peek when opening ⋯.
          onInteractOutside={(event) => {
            const target = event.target as HTMLElement | null;
            if (target?.closest('[data-slot="dropdown-menu-content"]')) {
              event.preventDefault();
            }
          }}
          side="right"
          sideOffset={8}
        >
          <div
            className={cn(
              "relative px-3.5 pt-3.5 pb-3",
              session.status === "CANCELLED"
                ? "bg-destructive/5"
                : session.status === "COMPLETED"
                  ? "bg-emerald-500/5"
                  : scheduled
                    ? "bg-muted/30"
                    : "bg-primary/5",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute inset-y-3 left-0 w-1 rounded-r-full",
                session.status === "CANCELLED"
                  ? "bg-destructive"
                  : session.status === "COMPLETED"
                    ? "bg-emerald-500"
                    : scheduled
                      ? "bg-muted-foreground/40"
                      : "bg-primary",
              )}
            />
            <PopoverHeader className="gap-2.5 pl-2">
              <div className="flex items-start gap-2.5">
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className={cn(
                          "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
                          session.status === "CANCELLED"
                            ? "bg-destructive/10 text-destructive"
                            : session.status === "COMPLETED"
                              ? "bg-emerald-500/15 text-emerald-800 dark:text-emerald-100"
                              : scheduled
                                ? "bg-muted text-foreground"
                                : "bg-primary/15 text-primary",
                        )}
                        data-testid={`session-peek-type-${session.id}`}
                      >
                        {session.status === "CANCELLED" ? (
                          <Ban aria-hidden className="size-4 opacity-90" />
                        ) : session.status === "COMPLETED" ? (
                          <CheckCircle2 aria-hidden className="size-4 opacity-90" />
                        ) : scheduled ? (
                          <RefreshCw aria-hidden className="size-4 opacity-80" />
                        ) : (
                          <Plus aria-hidden className="size-4 opacity-80" />
                        )}
                        <span className="sr-only">{sessionTypeLabel(session.type)}</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      {sessionTypeLabel(session.type)}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <PopoverTitle
                      className={cn(
                        "type-section tabular-nums leading-tight text-foreground",
                        session.status === "CANCELLED" &&
                          "line-through decoration-destructive/50",
                      )}
                    >
                      {clock}
                    </PopoverTitle>
                    <Badge
                      className={cn("shrink-0", sessionStatusBadgeClass(session.status))}
                      variant="outline"
                    >
                      {sessionStatusLabel(session.status)}
                    </Badge>
                  </div>
                  <PopoverDescription className="mt-1 type-secondary text-muted-foreground">
                    {date.label}
                  </PopoverDescription>
                  {displayName ? (
                    <TooltipProvider delayDuration={200}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <p className="mt-1.5 line-clamp-2 type-body text-foreground/85">
                            {displayName}
                          </p>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs text-balance" side="bottom">
                          {displayName}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : null}
                  {showAttendanceSummary ? (
                    <PeekAttendanceSummary
                      absent={attendanceCounts.absent}
                      attended={attendanceCounts.attended}
                      pending={attendanceSummaryPending}
                      separated={Boolean(displayName)}
                      unknown={attendanceCounts.unknown}
                    />
                  ) : null}
                </div>
              </div>
            </PopoverHeader>
          </div>

          {editing && canEditAdhoc ? (
            <form
              className="flex flex-col gap-3 border-t border-border/80 bg-background p-3"
              data-testid={`session-peek-edit-form-${session.id}`}
              onSubmit={(event) => {
                event.preventDefault();
                void saveEdits();
              }}
            >
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`peek-date-${session.id}`}>Date</Label>
                <Input
                  data-testid={`session-peek-date-${session.id}`}
                  id={`peek-date-${session.id}`}
                  onChange={(e) => setSessionDate(e.target.value)}
                  required
                  type="date"
                  value={sessionDate}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`peek-start-${session.id}`}>Start</Label>
                  <Input
                    data-testid={`session-peek-start-${session.id}`}
                    id={`peek-start-${session.id}`}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    type="time"
                    value={startTime}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor={`peek-end-${session.id}`}>End</Label>
                  <Input
                    data-testid={`session-peek-end-${session.id}`}
                    id={`peek-end-${session.id}`}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    type="time"
                    value={endTime}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor={`peek-name-${session.id}`}>Name</Label>
                <Input
                  data-testid={`session-peek-name-${session.id}`}
                  id={`peek-name-${session.id}`}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Optional"
                  value={name}
                />
              </div>
              {failure ? (
                <Alert data-testid={`session-peek-edit-error-${session.id}`} variant="destructive">
                  <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
                </Alert>
              ) : null}
              <div className="flex gap-1.5">
                <Button
                  className="flex-1"
                  data-testid={`session-peek-edit-cancel-${session.id}`}
                  disabled={saving}
                  onClick={() => {
                    setEditing(false);
                    setFailure(null);
                    setSessionDate(session.sessionDate);
                    setStartTime(clockHm(session.startTime));
                    setEndTime(clockHm(session.endTime));
                    setName(session.name ?? "");
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  data-testid={`session-peek-edit-save-${session.id}`}
                  disabled={saving || !sessionDate}
                  size="sm"
                  type="submit"
                >
                  {saving ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          ) : !isCancelled ? (
            <div className="border-t border-border/80 bg-background px-3 py-2.5">
              {isOpen ? (
                <div className="flex items-center gap-1.5">
                  <Button
                    className="min-w-0 flex-1"
                    data-testid={`session-peek-attendance-${session.id}`}
                    onClick={openAttendance}
                    size="sm"
                    type="button"
                  >
                    <ClipboardCheck aria-hidden />
                    Take attendance
                  </Button>
                  {/* modal=false — dropdown inside peek popover must not steal focus/close it. */}
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        aria-label="More session actions"
                        data-testid={`session-peek-more-${session.id}`}
                        size="icon-sm"
                        type="button"
                        variant="outline"
                      >
                        <MoreHorizontal aria-hidden className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" data-testid={`session-peek-menu-${session.id}`}>
                      {canEditAdhoc ? (
                        <DropdownMenuItem
                          data-testid={`session-peek-edit-${session.id}`}
                          onSelect={() => setEditing(true)}
                        >
                          <Pencil aria-hidden />
                          Edit session
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        data-testid={`session-peek-cancel-${session.id}`}
                        onSelect={openCancelDialog}
                        variant="destructive"
                      >
                        <Ban aria-hidden />
                        Cancel session
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : null}
              {isCompleted ? (
                <Button
                  className="w-full"
                  data-testid={`session-peek-attendance-${session.id}`}
                  onClick={openAttendance}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <ClipboardCheck aria-hidden />
                  View attendance
                </Button>
              ) : null}
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      <SessionCancelDialog
        classroomId={classroomId}
        onOpenChange={setConfirmCancel}
        open={confirmCancel}
        session={session}
      />
    </>
  );
}