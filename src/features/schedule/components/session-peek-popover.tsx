import { useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Plus,
  RefreshCw,
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/shared/lib/cn";
import {
  sessionChipClass,
  sessionStatusBadgeClass,
  sessionStatusLabel,
  sessionTypeLabel,
} from "../lib/session-buckets";
import { cancelSession, type SessionRow } from "../lib/session-api";
import {
  formatSessionClockRange,
  formatSessionWhen,
  sessionDateParts,
} from "../lib/session-time";

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
  const [cancelling, setCancelling] = useState(false);

  const scheduled = session.type === "SCHEDULE";
  const isOpen = session.status === "OPEN";
  const isCompleted = session.status === "COMPLETED";
  const isCancelled = session.status === "CANCELLED";
  const name = session.name?.trim();
  const clock = formatSessionClockRange(
    session.sessionDate,
    session.startTime,
    session.endTime,
  );
  const date = sessionDateParts(session.sessionDate);
  const sessionLabel =
    name || formatSessionWhen(session.sessionDate, session.startTime, session.endTime);

  function openAttendance() {
    setOpen(false);
    void navigate({
      to: "/classrooms/$classroomId/sessions/$sessionId",
      params: { classroomId, sessionId: session.id },
    });
  }

  async function confirmCancelSession() {
    if (cancelling || !isOpen) return;
    setCancelling(true);
    try {
      await cancelSession(classroomId, session.id);
      setConfirmCancel(false);
    } finally {
      setCancelling(false);
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
                <span
                  aria-hidden
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
                >
                  {session.status === "CANCELLED" ? (
                    <Ban className="size-4 opacity-90" />
                  ) : session.status === "COMPLETED" ? (
                    <CheckCircle2 className="size-4 opacity-90" />
                  ) : scheduled ? (
                    <RefreshCw className="size-4 opacity-80" />
                  ) : (
                    <Plus className="size-4 opacity-80" />
                  )}
                </span>
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
                  {name ? (
                    <p className="mt-1.5 truncate type-body text-foreground/85">{name}</p>
                  ) : null}
                </div>
              </div>
              <p className="pl-11 type-secondary font-medium text-muted-foreground">
                {sessionTypeLabel(session.type)}
              </p>
            </PopoverHeader>
          </div>

          {!isCancelled ? (
            <div className="flex flex-col gap-1.5 border-t border-border/80 bg-background p-2.5">
              {isOpen ? (
                <>
                  <Button
                    className="w-full justify-start"
                    data-testid={`session-peek-attendance-${session.id}`}
                    onClick={openAttendance}
                    size="sm"
                    type="button"
                  >
                    <ClipboardCheck aria-hidden />
                    Take attendance
                  </Button>
                  <Button
                    className="w-full justify-start text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    data-testid={`session-peek-cancel-${session.id}`}
                    onClick={() => {
                      setOpen(false);
                      setConfirmCancel(true);
                    }}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Cancel session
                  </Button>
                </>
              ) : null}
              {isCompleted ? (
                <Button
                  className="w-full justify-start"
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

      <AlertDialog
        onOpenChange={(next) => {
          if (!next) setConfirmCancel(false);
        }}
        open={confirmCancel}
      >
        <AlertDialogContent data-testid={`session-peek-cancel-dialog-${session.id}`}>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {sessionLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the session. Attendance can no longer change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="session-peek-cancel-dismiss" disabled={cancelling}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="session-peek-cancel-confirm"
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault();
                void confirmCancelSession();
              }}
            >
              {cancelling ? "Cancelling…" : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
