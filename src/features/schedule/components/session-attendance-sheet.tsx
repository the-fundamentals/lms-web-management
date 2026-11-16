import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardCheck, Pencil, XIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/shared/lib/cn";
import { requestFailedMessage } from "@/shared/ui/request-status";
import {
  sessionStatusBadgeClass,
  sessionStatusLabel,
  sessionTypeLabel,
} from "../lib/session-buckets";
import { sessionQueryOptions, updateSession } from "../lib/session-api";
import {
  formatSessionClockRange,
  sessionDateParts,
} from "../lib/session-time";
import { SessionAttendance } from "./session-attendance";
import { SessionCancelDialog } from "./session-cancel-dialog";

type SessionAttendanceSheetProps = {
  classroomId: string;
  sessionId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * Session attendance modal.
 *
 * Hierarchy (top → bottom, left → right):
 * 1. Full-width header — name (edit-on-demand) + when / type / status
 * 2. Body columns — notes + complete (left) | roster marks (right)
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
  const canEditName = session?.status === "OPEN";
  const persistedName = session?.name?.trim() ?? "";
  const dateParts = session ? sessionDateParts(session.sessionDate) : null;
  const clock = session
    ? formatSessionClockRange(session.sessionDate, session.startTime, session.endTime)
    : null;
  const title = session ? persistedName || "Untitled Session" : "Session";

  const [confirmCancel, setConfirmCancel] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(persistedName);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameFailure, setNameFailure] = useState<unknown>(null);

  useEffect(() => {
    if (!editingName) setNameDraft(persistedName);
  }, [editingName, persistedName]);

  useEffect(() => {
    setEditingName(false);
    setNameFailure(null);
  }, [sessionId, open]);

  async function saveName() {
    if (!session || nameSaving) return;
    setNameSaving(true);
    setNameFailure(null);
    try {
      const next = nameDraft.trim();
      // Omit clears — keep description when renaming.
      await updateSession(classroomId, session.id, {
        name: next || null,
        description: session.description?.trim() ? session.description : null,
      });
      setEditingName(false);
      await sessionQuery.refetch();
    } catch (error) {
      setNameFailure(error);
    } finally {
      setNameSaving(false);
    }
  }

  return (
    <>
      <Dialog onOpenChange={onOpenChange} open={open}>
        <DialogContent
          className={cn(
            "flex h-[75dvh] max-h-[75dvh] w-[min(100%-2rem,56rem)] min-w-0 flex-col gap-0 overflow-hidden p-0 sm:min-w-[44rem] sm:max-w-[56rem]",
          )}
          data-testid="session-attendance-sheet"
          onCloseAutoFocus={(event) => event.preventDefault()}
          onOpenAutoFocus={(event) => event.preventDefault()}
          showCloseButton={false}
        >
          {open ? (
            <>
              <div className="relative shrink-0 border-b border-border/80 bg-muted/20">
                <DialogClose
                  className="absolute top-3 right-3 z-10 rounded-xs opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-hidden disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4"
                  data-testid="session-attendance-close"
                >
                  <span className="flex size-8 items-center justify-center">
                    <XIcon />
                  </span>
                  <span className="sr-only">Close</span>
                </DialogClose>

                <DialogHeader className="gap-0 px-5 py-3.5 pr-14 text-left">
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardCheck aria-hidden className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      {editingName && canEditName ? (
                        <div
                          className="flex flex-col gap-2 sm:flex-row sm:items-center"
                          data-testid="session-title-block"
                        >
                          <Label
                            className="sr-only"
                            htmlFor={`session-sheet-name-${sessionId}`}
                          >
                            Session name
                          </Label>
                          <Input
                            className="h-8 min-w-0 flex-1"
                            data-testid="session-title-input"
                            id={`session-sheet-name-${sessionId}`}
                            onChange={(e) => setNameDraft(e.target.value)}
                            placeholder="Session name"
                            value={nameDraft}
                          />
                          <div className="flex shrink-0 gap-1">
                            <Button
                              data-testid="session-title-cancel"
                              disabled={nameSaving}
                              onClick={() => {
                                setEditingName(false);
                                setNameDraft(persistedName);
                                setNameFailure(null);
                              }}
                              size="sm"
                              type="button"
                              variant="ghost"
                            >
                              Cancel
                            </Button>
                            <Button
                              data-testid="session-title-save"
                              disabled={nameSaving}
                              onClick={() => void saveName()}
                              size="sm"
                              type="button"
                            >
                              {nameSaving ? "Saving…" : "Save"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div
                          className="group/title flex min-w-0 items-center gap-1"
                          data-testid="session-title-block"
                        >
                          <DialogTitle
                            className={cn(
                              "min-w-0 truncate type-section leading-none",
                              !persistedName && "text-muted-foreground",
                            )}
                            data-testid="session-title-display"
                          >
                            {title}
                          </DialogTitle>
                          {canEditName ? (
                            <Button
                              aria-label="Edit session name"
                              className="size-7 shrink-0 p-0 opacity-0 transition-opacity group-hover/title:opacity-100 focus-visible:opacity-100"
                              data-testid="session-edit-title"
                              onClick={() => {
                                setNameDraft(persistedName);
                                setEditingName(true);
                                setNameFailure(null);
                              }}
                              size="icon-sm"
                              type="button"
                              variant="ghost"
                            >
                              <Pencil aria-hidden className="size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      )}

                      <DialogDescription asChild>
                        <div
                          className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-none"
                          data-testid="session-header-meta"
                        >
                          {session && dateParts && clock ? (
                            <>
                              <span>
                                {dateParts.label} · {clock}
                              </span>
                              <span aria-hidden className="text-muted-foreground/40">
                                ·
                              </span>
                              <span>{sessionTypeLabel(session.type)}</span>
                              <span aria-hidden className="text-muted-foreground/40">
                                ·
                              </span>
                              <Badge
                                className={cn(
                                  "px-1.5 py-0 text-[0.65rem] font-semibold tracking-wide uppercase",
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

                      {nameFailure ? (
                        <Alert
                          className="mt-2"
                          data-testid="session-meta-error"
                          variant="destructive"
                        >
                          <AlertDescription>
                            {requestFailedMessage(nameFailure)}
                          </AlertDescription>
                        </Alert>
                      ) : null}
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <SessionAttendance
                classroomId={classroomId}
                key={sessionId}
                onRequestCancel={
                  canCancel ? () => setConfirmCancel(true) : undefined
                }
                sessionId={sessionId}
              />
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <SessionCancelDialog
        classroomId={classroomId}
        onOpenChange={setConfirmCancel}
        open={confirmCancel}
        session={session ?? null}
      />
    </>
  );
}
