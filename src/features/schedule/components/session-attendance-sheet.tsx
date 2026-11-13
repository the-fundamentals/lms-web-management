import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ban, ClipboardCheck, MoreHorizontal, XIcon } from "lucide-react";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/shared/lib/cn";
import {
  sessionStatusBadgeClass,
  sessionStatusLabel,
  sessionTypeLabel,
} from "../lib/session-buckets";
import { cancelSession, sessionQueryOptions } from "../lib/session-api";
import {
  formatSessionWhen,
  sessionDateParts,
} from "../lib/session-time";
import { SessionAttendance } from "./session-attendance";

type SessionAttendanceSheetProps = {
  classroomId: string;
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Session attendance — centered modal (filename kept for import stability).
 * Keeps Sessions overview visible underneath.
 * Header chrome: ⋯ (Cancel session) then X (dismiss) — matches dialog close cluster.
 */
export function SessionAttendanceSheet({
  classroomId,
  sessionId,
  open,
  onOpenChange,
}: SessionAttendanceSheetProps) {
  const sessionQuery = useQuery({
    ...sessionQueryOptions(classroomId, sessionId),
    enabled: open && Boolean(sessionId),
  });
  const session = sessionQuery.data;
  const canCancel = session?.status === "OPEN";
  const name = session?.name?.trim();
  const dateParts = session ? sessionDateParts(session.sessionDate) : null;
  // Title = session name only; date lives in Session details. Unnamed → civil date.
  const title = session
    ? name || `${dateParts!.label} ${session.sessionDate.slice(0, 4)}`
    : "Session";
  const sessionLabel =
    name ||
    (session
      ? formatSessionWhen(session.sessionDate, session.startTime, session.endTime)
      : "this session");

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  async function runCancel() {
    if (cancelling) return;
    setCancelling(true);
    try {
      await cancelSession(classroomId, sessionId);
      setConfirmCancel(false);
      await sessionQuery.refetch();
    } finally {
      setCancelling(false);
    }
  }

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className="flex h-[75dvh] max-h-[75dvh] w-[min(100%-2rem,50vw)] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:min-w-[32rem] sm:max-w-[50vw]"
          data-testid="session-attendance-sheet"
          onCloseAutoFocus={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
          showCloseButton={false}
        >
          {/* ⋯ then X — same corner as default Dialog close */}
          <div className="absolute top-3.5 right-3.5 z-10 flex items-center gap-0.5">
            {canCancel ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    className="size-8 text-muted-foreground opacity-70 hover:opacity-100"
                    data-testid="session-actions-menu"
                    size="icon-sm"
                    type="button"
                    variant="ghost"
                  >
                    <MoreHorizontal aria-hidden className="size-4" />
                    <span className="sr-only">Session actions</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    data-testid="session-cancel"
                    onSelect={() => setConfirmCancel(true)}
                    variant="destructive"
                  >
                    <Ban aria-hidden />
                    Cancel session
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            <DialogClose
              className="rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
              data-testid="session-attendance-close"
            >
              <span className="flex size-8 items-center justify-center">
                <XIcon />
              </span>
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          <DialogHeader className="shrink-0 border-b border-border/80 bg-muted/20 px-5 py-5 pr-24 text-left">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <ClipboardCheck aria-hidden className="size-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-1.5">
                <DialogTitle className="type-section">{title}</DialogTitle>
                <DialogDescription asChild>
                  <div
                    className="flex flex-wrap items-center gap-2"
                    data-testid="session-header-meta"
                  >
                    {session ? (
                      <>
                        <span>{sessionTypeLabel(session.type)}</span>
                        <span aria-hidden className="text-muted-foreground/40">
                          ·
                        </span>
                        <Badge
                          className={cn(
                            "px-2 py-0 text-[0.65rem] font-semibold tracking-wide uppercase",
                            sessionStatusBadgeClass(session.status),
                          )}
                          data-testid="session-status-banner"
                          variant="outline"
                        >
                          {sessionStatusLabel(session.status)}
                        </Badge>
                      </>
                    ) : (
                      <span>Take attendance or complete the session</span>
                    )}
                  </div>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {open ? (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <SessionAttendance
                classroomId={classroomId}
                key={sessionId}
                sessionId={sessionId}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(next) => {
          if (!next) setConfirmCancel(false);
        }}
        open={confirmCancel}
      >
        <AlertDialogContent data-testid="session-lifecycle-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel {sessionLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              This cancels the session. Attendance can no longer change.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="session-lifecycle-dismiss" disabled={cancelling}>
              Back
            </AlertDialogCancel>
            <AlertDialogAction
              data-testid="session-lifecycle-confirm"
              disabled={cancelling}
              onClick={(event) => {
                event.preventDefault();
                void runCancel();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
