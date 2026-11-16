import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Ban } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/shared/lib/cn";
import { requestFailedMessage } from "@/shared/ui/request-status";
import {
  cancelSession,
  deleteRecurrence,
  recurrencesQueryOptions,
  type SessionRow,
} from "../lib/session-api";
import { formatSessionClockRange, sessionDateParts } from "../lib/session-time";
import { matchSessionRecurrence } from "../lib/truncate-calendar";

type CancelScope = "this" | "series";

type SessionCancelDialogProps = {
  classroomId: string;
  session: SessionRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Shared cancel flow for calendar peek + attendance sheet.
 * ADHOC → cancelSession; SCHEDULE → this occurrence or truncate series.
 */
export function SessionCancelDialog({
  classroomId,
  session,
  open,
  onOpenChange,
}: SessionCancelDialogProps) {
  const [cancelScope, setCancelScope] = useState<CancelScope>("this");
  const [cancelling, setCancelling] = useState(false);
  const [failure, setFailure] = useState<unknown>(null);

  const scheduled = session?.type === "SCHEDULE";
  const sessionId = session?.id ?? "unknown";

  const recurrencesQuery = useQuery({
    ...recurrencesQueryOptions(classroomId),
    enabled: open && Boolean(scheduled && session),
  });
  const matchedRecurrence = useMemo(
    () =>
      scheduled && session && recurrencesQuery.data
        ? matchSessionRecurrence(session, recurrencesQuery.data)
        : undefined,
    [scheduled, session, recurrencesQuery.data],
  );

  useEffect(() => {
    if (!open) {
      setCancelScope("this");
      setFailure(null);
      setCancelling(false);
    }
  }, [open]);

  async function confirm() {
    if (!session || cancelling || session.status !== "OPEN") return;
    if (scheduled && cancelScope === "series" && !matchedRecurrence) return;
    setCancelling(true);
    setFailure(null);
    try {
      if (scheduled && cancelScope === "series" && matchedRecurrence) {
        // Truncate series at this session date — OPEN occurrences on/after cutoff cancel.
        await deleteRecurrence(classroomId, matchedRecurrence.id, session.sessionDate);
      } else {
        await cancelSession(classroomId, session.id);
      }
      onOpenChange(false);
    } catch (error) {
      setFailure(error);
    } finally {
      setCancelling(false);
    }
  }

  const displayName = session?.name?.trim();
  const clock = session
    ? formatSessionClockRange(session.sessionDate, session.startTime, session.endTime)
    : "";
  const date = session ? sessionDateParts(session.sessionDate) : null;

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent
        className="gap-5 sm:max-w-md"
        data-testid={`session-cancel-dialog-${sessionId}`}
        showCloseButton={false}
      >
        <DialogHeader className="gap-3 sm:text-left">
          <div className="flex size-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <Ban aria-hidden className="size-5" />
          </div>
          <div className="flex flex-col gap-1.5">
            <DialogTitle>Cancel this session?</DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-1">
                {session && date ? (
                  <p className="type-body text-foreground/80">
                    {displayName ? (
                      <>
                        <span className="font-medium text-foreground">{displayName}</span>
                        <span className="text-muted-foreground"> · </span>
                      </>
                    ) : null}
                    <span className="tabular-nums">
                      {date.label} · {clock}
                    </span>
                  </p>
                ) : null}
                <p>
                  {scheduled
                    ? "Attendance locks on anything you cancel."
                    : "Attendance can no longer change after this."}
                </p>
              </div>
            </DialogDescription>
          </div>
        </DialogHeader>

        {scheduled ? (
          <div
            aria-label="Cancel scope"
            className="flex flex-col gap-1 rounded-xl bg-muted/50 p-1"
            data-testid={`session-cancel-scope-${sessionId}`}
            role="radiogroup"
          >
            {(
              [
                {
                  value: "this" as const,
                  title: "This session only",
                  detail: "Weekly pattern keeps going.",
                  testId: `session-cancel-this-${sessionId}`,
                  disabled: false,
                },
                {
                  value: "series" as const,
                  title: "This and future sessions",
                  detail: matchedRecurrence
                    ? "Ends the weekly pattern from this date on."
                    : recurrencesQuery.isLoading
                      ? "Finding the weekly pattern…"
                      : "Couldn’t match a weekly pattern.",
                  testId: `session-cancel-series-${sessionId}`,
                  disabled: !matchedRecurrence || recurrencesQuery.isLoading,
                },
              ] as const
            ).map((option) => {
              const selected = cancelScope === option.value;
              return (
                <button
                  aria-checked={selected}
                  className={cn(
                    "flex items-start gap-3 rounded-lg px-3 py-3 text-left transition-colors",
                    "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                    selected
                      ? "bg-background shadow-sm ring-1 ring-border"
                      : "hover:bg-background/60",
                    option.disabled && "cursor-not-allowed opacity-55",
                  )}
                  data-testid={option.testId}
                  disabled={option.disabled}
                  key={option.value}
                  onClick={() => setCancelScope(option.value)}
                  role="radio"
                  type="button"
                >
                  <span
                    aria-hidden
                    className={cn(
                      "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
                      selected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40 bg-transparent",
                    )}
                  >
                    {selected ? (
                      <span className="size-1.5 rounded-full bg-primary-foreground" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block type-body font-medium text-foreground">
                      {option.title}
                    </span>
                    <span className="mt-0.5 block type-secondary text-muted-foreground">
                      {option.detail}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : null}

        {failure ? (
          <Alert data-testid={`session-cancel-error-${sessionId}`} variant="destructive">
            <AlertDescription>{requestFailedMessage(failure)}</AlertDescription>
          </Alert>
        ) : null}

        <DialogFooter className="gap-2 sm:justify-stretch">
          <Button
            className="sm:flex-1"
            data-testid="session-cancel-dismiss"
            disabled={cancelling}
            onClick={() => onOpenChange(false)}
            type="button"
            variant="outline"
          >
            Back
          </Button>
          <Button
            className="sm:flex-1"
            data-testid="session-cancel-confirm"
            disabled={
              cancelling ||
              !session ||
              (Boolean(scheduled) && cancelScope === "series" && !matchedRecurrence)
            }
            onClick={() => void confirm()}
            type="button"
            variant="destructive"
          >
            {cancelling
              ? "Cancelling…"
              : scheduled && cancelScope === "series"
                ? "Cancel series"
                : "Cancel session"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
